import json
import time
from datetime import datetime, timedelta
from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}
session = cffi_requests.Session(impersonate="chrome120")
session.get("https://www.nseindia.com", headers=headers, timeout=10)

api_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/companies-listing/corporate-filings-financial-results',
}

print("=== Testing /api/corporates-financial-results parameters ===")
# Test periods and parameters
periods = ["Quarterly", "Half-Yearly", "Annual"]
for p in periods:
    url = f"https://www.nseindia.com/api/corporates-financial-results?index=equities&period={p}"
    r = session.get(url, headers=api_headers, timeout=20)
    print(f"Period='{p}': Status {r.status_code}, Length: {len(r.content)}")
    if r.status_code == 200:
        try:
            items = r.json()
            print(f"   Items count: {len(items)}")
        except Exception as e:
            print(f"   Error parsing json: {e}")
    time.sleep(1)

# Test SME period
url_sme = "https://www.nseindia.com/api/corporates-financial-results?index=sme&period=Quarterly"
r_sme = session.get(url_sme, headers=api_headers, timeout=20)
print(f"SME Period='Quarterly': Status {r_sme.status_code}, Length: {len(r_sme.content)}, Items: {len(r_sme.json()) if r_sme.status_code==200 else 0}")

print("\n=== Testing burst rate limits ===")
success_count = 0
status_codes = {}
start_t = time.time()
for i in range(15):
    url = "https://www.nseindia.com/api/event-calendar"
    r = session.get(url, headers=api_headers, timeout=5)
    status_codes[r.status_code] = status_codes.get(r.status_code, 0) + 1
    if r.status_code == 200:
        success_count += 1
    time.sleep(0.1) # 100ms spacing
duration = time.time() - start_t
print(f"Burst test: {success_count}/15 successful in {duration:.2f} seconds. Status breakdown: {status_codes}")

print("\n=== Testing Cookie requirements and headers ===")
# Test without Referer
r_no_ref = session.get("https://www.nseindia.com/api/event-calendar", headers={'User-Agent': api_headers['User-Agent']}, timeout=5)
print(f"Without Referer status: {r_no_ref.status_code}")

# Test with wrong Referer
r_wrong_ref = session.get("https://www.nseindia.com/api/event-calendar", headers={'User-Agent': api_headers['User-Agent'], 'Referer': 'https://google.com'}, timeout=5)
print(f"With Google Referer status: {r_wrong_ref.status_code}")
