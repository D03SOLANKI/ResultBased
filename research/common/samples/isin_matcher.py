import io
import json
import os
import pandas as pd
from curl_cffi import requests

os.makedirs("research/common/samples", exist_ok=True)

# 1. Fetch NSE Equity List
print("Fetching NSE Equity Master...")
nse_url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
r_nse = requests.get(nse_url, impersonate="chrome120")
df_nse = pd.read_csv(io.StringIO(r_nse.text))
df_nse.columns = [c.strip() for c in df_nse.columns]
df_nse["ISIN"] = df_nse["ISIN NUMBER"].astype(str).str.strip()
df_nse["SYMBOL"] = df_nse["SYMBOL"].astype(str).str.strip()
df_nse["NAME"] = df_nse["NAME OF COMPANY"].astype(str).str.strip()
df_nse["SERIES"] = df_nse["SERIES"].astype(str).str.strip()

# Save raw NSE master
df_nse.to_csv("research/common/samples/nse_equity_master_raw.csv", index=False)

# 2. Fetch BSE Equity List
print("Fetching BSE Equity Master...")
headers = {"Referer": "https://www.bseindia.com/"}
bse_url = "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active"
r_bse = requests.get(bse_url, headers=headers, impersonate="chrome120")
bse_data = r_bse.json()
df_bse = pd.DataFrame(bse_data)
df_bse["ISIN"] = df_bse["ISIN_NUMBER"].astype(str).str.strip()
df_bse["BSE_CODE"] = df_bse["SCRIP_CD"].astype(str).str.strip()
df_bse["BSE_ID"] = df_bse["scrip_id"].astype(str).str.strip()
df_bse["BSE_NAME"] = df_bse["Scrip_Name"].astype(str).str.strip()
df_bse["BSE_ISSUER"] = df_bse["Issuer_Name"].astype(str).str.strip()
df_bse["GROUP"] = df_bse["GROUP"].astype(str).str.strip()

# Save raw BSE master
df_bse.to_csv("research/common/samples/bse_equity_master_raw.csv", index=False)

print(f"Total NSE rows: {len(df_nse)}")
print(f"Unique NSE ISINs: {df_nse['ISIN'].nunique()}")
print(f"Total BSE rows: {len(df_bse)}")
print(f"Unique BSE ISINs: {df_bse['ISIN'].nunique()}")

# Duplicate ISIN analysis
nse_dups = df_nse[df_nse.duplicated(subset=["ISIN"], keep=False)]
print(f"NSE Duplicate ISIN count: {len(nse_dups)}")
if len(nse_dups) > 0:
    print("Sample NSE duplicates:")
    print(nse_dups[["SYMBOL", "SERIES", "ISIN", "NAME"]].head(10))

bse_dups = df_bse[df_bse.duplicated(subset=["ISIN"], keep=False)]
print(f"BSE Duplicate ISIN count: {len(bse_dups)}")
if len(bse_dups) > 0:
    print("Sample BSE duplicates:")
    print(bse_dups[["BSE_CODE", "BSE_ID", "GROUP", "ISIN", "BSE_NAME"]].head(10))

# Cross matching
nse_unique = df_nse.drop_duplicates(subset=["ISIN"])
bse_unique = df_bse.drop_duplicates(subset=["ISIN"])

merged_both = pd.merge(nse_unique, bse_unique, on="ISIN", how="inner")
nse_only = nse_unique[~nse_unique["ISIN"].isin(bse_unique["ISIN"])]
bse_only = bse_unique[~bse_unique["ISIN"].isin(nse_unique["ISIN"])]

pct_nse_in_bse = (len(merged_both) / len(nse_unique)) * 100
pct_bse_in_nse = (len(merged_both) / len(bse_unique)) * 100

print("\n--- Cross-Exchange Mapping Statistics ---")
print(f"Both Exchanges (Common ISINs): {len(merged_both)}")
print(f"NSE Only ISINs: {len(nse_only)} ({len(nse_only)/len(nse_unique)*100:.2f}%)")
print(f"BSE Only ISINs: {len(bse_only)} ({len(bse_only)/len(bse_unique)*100:.2f}%)")
print(f"% of NSE stocks on BSE: {pct_nse_in_bse:.2f}%")
print(f"% of BSE stocks on NSE: {pct_bse_in_nse:.2f}%")

# Save merged dataset & subsets
cols_to_save = [
    "ISIN", "SYMBOL", "NAME", "SERIES", "BSE_CODE", "BSE_ID", "BSE_NAME", "GROUP"
]
merged_both[cols_to_save].to_csv("research/common/samples/cross_exchange_mapped.csv", index=False)
nse_only[["ISIN", "SYMBOL", "NAME", "SERIES"]].to_csv("research/common/samples/nse_only_securities.csv", index=False)
bse_only[["ISIN", "BSE_CODE", "BSE_ID", "BSE_NAME", "GROUP"]].to_csv("research/common/samples/bse_only_securities.csv", index=False)

# Edge case inspection:
# 1. Symbol discrepancy (where NSE SYMBOL != BSE scrip_id)
symbol_diff = merged_both[merged_both["SYMBOL"].str.upper() != merged_both["BSE_ID"].str.upper()]
print(f"\nNumber of dual-listed stocks where NSE SYMBOL != BSE scrip_id: {len(symbol_diff)} ({len(symbol_diff)/len(merged_both)*100:.2f}%)")
symbol_diff[cols_to_save].head(20).to_csv("research/common/samples/symbol_mismatch_examples.csv", index=False)

# 2. Name discrepancy (NSE NAME != BSE Scrip_Name)
name_diff = merged_both[merged_both["NAME"].str.upper().str.replace(" LIMITED", " LTD").str.replace(".", "") != merged_both["BSE_NAME"].str.upper().str.replace(" LIMITED", " LTD").str.replace(".", "")]
print(f"Number of dual-listed stocks with noticeable name variation: {len(name_diff)}")
name_diff[cols_to_save].head(20).to_csv("research/common/samples/name_mismatch_examples.csv", index=False)

# Write summary JSON
summary = {
    "nse_total_records": len(df_nse),
    "nse_unique_isins": int(df_nse['ISIN'].nunique()),
    "bse_total_records": len(df_bse),
    "bse_unique_isins": int(df_bse['ISIN'].nunique()),
    "common_isins": len(merged_both),
    "nse_only_isins": len(nse_only),
    "bse_only_isins": len(bse_only),
    "pct_nse_on_bse": round(pct_nse_in_bse, 2),
    "pct_bse_on_nse": round(pct_bse_in_nse, 2),
    "symbol_mismatch_count_in_common": len(symbol_diff),
    "symbol_mismatch_pct": round(len(symbol_diff)/len(merged_both)*100, 2)
}

with open("research/common/samples/mapping_summary.json", "w") as f:
    json.dump(summary, f, indent=2)

print("\nSaved all matching outputs and summary JSON to research/common/samples/")
