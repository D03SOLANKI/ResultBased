"""
AMFI Market Capitalization Downloader and Classifier Utility
Author: Subagent D (Supporting Services & Infrastructure Specialist)
Description:
    Downloads the official semi-annual AMFI Market Capitalization categorization Excel sheet,
    parses company rankings, and classifies equities into Large Cap, Mid Cap, Small Cap,
    Micro Cap, and Nano Cap according to SEBI circular SEBI/HO/IMD/DF3/CIR/P/2017/114 and
    institutional indexing standards.
"""

import os
import re
import ssl
import urllib.request
import pandas as pd
from typing import Optional, Dict, Tuple

AMFI_URL = "https://www.amfiindia.com/otherdata/categorisation-of-stocks"

def get_unverified_ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

def discover_latest_amfi_excel_url() -> str:
    """Scrapes the AMFI otherdata page to discover the latest published Excel categorization sheet."""
    ctx = get_unverified_ssl_context()
    req = urllib.request.Request(
        AMFI_URL,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    # Look for .xlsx links
    links = re.findall(r'href=[\"\']([^\"\']+\.xlsx)[\"\']', html, re.IGNORECASE)
    if not links:
        raise RuntimeError("No Excel categorization links found on AMFI page.")

    # Return the first link (most recent half-year)
    latest_url = links[0].strip()
    if not latest_url.startswith("http"):
        latest_url = "https://www.amfiindia.com" + latest_url
    return latest_url

def download_amfi_file(dest_path: str = "research/infra/samples/amfi_market_cap_latest.xlsx") -> str:
    """Downloads the latest AMFI Excel sheet to disk."""
    excel_url = discover_latest_amfi_excel_url()
    print(f"Discovered latest AMFI Excel URL: {excel_url}")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    ctx = get_unverified_ssl_context()
    req = urllib.request.Request(
        excel_url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=45) as resp:
        content = resp.read()
        with open(dest_path, "wb") as f:
            f.write(content)
    print(f"Successfully saved {len(content):,} bytes to {dest_path}")
    return dest_path

def load_and_normalize_amfi(file_path: str) -> pd.DataFrame:
    """
    Parses the AMFI Excel sheet and returns a clean normalized DataFrame
    with standardized column names and granular tier classification.
    """
    # Header is typically at row 1
    df = pd.read_excel(file_path, sheet_name=0, header=1)

    # Standardize column names
    col_map = {
        df.columns[0]: 'sr_no',
        df.columns[1]: 'company_name',
        df.columns[2]: 'isin',
        df.columns[3]: 'bse_symbol',
        df.columns[4]: 'bse_avg_mcap_cr',
        df.columns[5]: 'nse_symbol',
        df.columns[6]: 'nse_avg_mcap_cr',
        df.columns[7]: 'msei_symbol',
        df.columns[8]: 'msei_avg_mcap_cr',
        df.columns[9]: 'avg_mcap_cr',
        df.columns[10]: 'sebi_category'
    }
    df = df.rename(columns=col_map)

    # Numeric conversion
    df['sr_no'] = pd.to_numeric(df['sr_no'], errors='coerce')
    df['avg_mcap_cr'] = pd.to_numeric(df['avg_mcap_cr'], errors='coerce')
    df = df.dropna(subset=['sr_no']).sort_values('sr_no').reset_index(drop=True)
    df['sr_no'] = df['sr_no'].astype(int)

    # Clean symbols
    df['nse_symbol'] = df['nse_symbol'].astype(str).str.strip().replace({'-': None, 'nan': None})
    df['bse_symbol'] = df['bse_symbol'].astype(str).str.strip().replace({'-': None, 'nan': None})
    df['isin'] = df['isin'].astype(str).str.strip()

    # Assign granular classification tiers
    def classify_tier(row):
        rank = row['sr_no']
        if rank <= 100:
            return 'Large Cap'
        elif rank <= 250:
            return 'Mid Cap'
        elif rank <= 500:
            return 'Small Cap'
        elif rank <= 1000:
            return 'Micro Cap'
        else:
            return 'Nano Cap'

    df['granular_tier'] = df.apply(classify_tier, axis=1)
    return df

if __name__ == '__main__':
    sample_file = "research/infra/samples/amfi_market_cap_30Jun2026.xlsx"
    if not os.path.exists(sample_file):
        sample_file = download_amfi_file()
    df = load_and_normalize_amfi(sample_file)
    print("\nNormalized Data Overview:")
    print(df[['sr_no', 'company_name', 'nse_symbol', 'bse_symbol', 'avg_mcap_cr', 'sebi_category', 'granular_tier']].head(10))
    print("\nTier Distribution:")
    print(df['granular_tier'].value_counts())
