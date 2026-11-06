import json
import time
import requests
from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
}

api_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
}

print("Testing direct CSV download from nsearchives...")
csv_urls = [
    "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
    "https://archives.nseindia.com/content/equities/EQUITY_L.csv",
    "https://nsearchives.nseindia.com/content/equities/SME_EQUITY_L.csv",
    "https://archives.nseindia.com/content/equities/SME_EQUITY_L.csv",
]

for url in csv_urls:
    try:
        r = requests.get(url, headers=headers, timeout=10)
        print(f"URL: {url} -> Status: {r.status_code}, Length: {len(r.content)}, Content-Type: {r.headers.get('Content-Type')}")
        if r.status_code == 200:
            lines = r.text.strip().splitlines()
            print(f"  First line: {lines[0] if lines else 'empty'}")
            print(f"  Total lines: {len(lines)}")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
