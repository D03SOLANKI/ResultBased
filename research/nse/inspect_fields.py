import json
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
    'Referer': 'https://www.nseindia.com/',
}

print("=== Examining /api/live-analysis-emerge ===")
r_emerge = session.get("https://www.nseindia.com/api/live-analysis-emerge", headers=api_headers, timeout=10)
print(f"Status: {r_emerge.status_code}")
if r_emerge.status_code == 200:
    data = r_emerge.json()
    print(f"Data type: {type(data)}")
    if isinstance(data, dict):
        print(f"Keys: {list(data.keys())}")
        if 'data' in data:
            print(f"Count in data['data']: {len(data['data'])}")
            if len(data['data']) > 0:
                print(f"Sample item in data['data']: {json.dumps(data['data'][0], indent=2)[:300]}")
    elif isinstance(data, list):
        print(f"List length: {len(data)}")
        if len(data) > 0:
            print(f"Sample item: {json.dumps(data[0], indent=2)[:300]}")

print("\n=== Examining /api/corporates-financial-results fields ===")
r_fr = session.get("https://www.nseindia.com/api/corporates-financial-results?index=equities&symbol=RELIANCE", headers=api_headers, timeout=10)
if r_fr.status_code == 200:
    fr_data = r_fr.json()
    print(f"RELIANCE financial results items: {len(fr_data)}")
    if fr_data:
        print("Sample item keys:", list(fr_data[0].keys()))
        print("Sample item:", json.dumps(fr_data[0], indent=2))

print("\n=== Checking SME in /api/corporates-financial-results ===")
r_fr_sme = session.get("https://www.nseindia.com/api/corporates-financial-results?index=sme&period=Quarterly", headers=api_headers, timeout=10)
print(f"SME Quarterly financial results items: {len(r_fr_sme.json()) if r_fr_sme.status_code==200 else r_fr_sme.status_code}")

print("\n=== Checking SME in /api/event-calendar ===")
r_cal_all = session.get("https://www.nseindia.com/api/event-calendar", headers=api_headers, timeout=10)
all_events = r_cal_all.json()
# Are SME symbols included in /api/event-calendar?
# Let's see if we find any SME symbol from live-analysis-emerge or SME board meetings in event-calendar
print(f"Total /api/event-calendar items: {len(all_events)}")
