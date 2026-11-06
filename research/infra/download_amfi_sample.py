import urllib.request
import ssl
import pandas as pd
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Test candidates
urls_to_test = [
    ("30Jun2026", "https://portal.amfiindia.com/spages/AverageMarketCapitalization30Jun2026.xlsx"),
    ("31Dec2025", "https://www.amfiindia.com/Themes/Theme1/downloads/AverageMarketCapitalization31Dec2025.xlsx"),
    ("30Jun2025", "https://www.amfiindia.com/Themes/Theme1/downloads/AverageMarketCapitalization30Jun2025.xlsx"),
    ("31Dec2024", "https://www.amfiindia.com/Themes/Theme1/downloads/AverageMarketCapitalizationoflistedcompaniesduringthesixmonthsended31Dec2024.xlsx")
]

os.makedirs("research/infra/samples", exist_ok=True)

downloaded_file = None

for label, url in urls_to_test:
    dest = f"research/infra/samples/amfi_market_cap_{label}.xlsx"
    print(f"Trying to download {label} from {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            content = resp.read()
            print(f"Downloaded {len(content)} bytes for {label}.")
            with open(dest, "wb") as f:
                f.write(content)
            downloaded_file = dest
            print(f"Saved to {dest}")
            break
    except Exception as e:
        print(f"Failed to download {label}: {e}")

if downloaded_file and os.path.exists(downloaded_file):
    print("\nReading downloaded Excel file...")
    # Inspect sheet names
    xl = pd.ExcelFile(downloaded_file)
    print("Sheets:", xl.sheet_names)
    df = pd.read_excel(downloaded_file, sheet_name=0)
    print(f"Raw shape: {df.shape}")
    print("\nFirst 10 rows:")
    print(df.head(10))
