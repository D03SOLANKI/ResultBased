import json
import time
from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

session = cffi_requests.Session(impersonate="chrome120")
print("Initializing session on www.nseindia.com...", flush=True)
r = session.get("https://www.nseindia.com", headers=headers, timeout=10)
print(f"Homepage status: {r.status_code}, cookies count: {len(session.cookies)}")

# We should also visit an internal page like corporate filings to get proper referer and cookies
r2 = session.get("https://www.nseindia.com/companies-listing/corporate-filings-board-meetings", headers=headers, timeout=10)
print(f"Board meetings page status: {r2.status_code}, cookies count: {len(session.cookies)}")

api_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/companies-listing/corporate-filings-board-meetings',
}

endpoints_to_test = [
    ("/api/corporate-board-meetings?index=equities", "board_meetings_equities"),
    ("/api/corporate-board-meetings?index=sme", "board_meetings_sme"),
    ("/api/corporate-announcements?index=equities", "announcements_equities"),
    ("/api/corporate-announcements?index=sme", "announcements_sme"),
    ("/api/event-calendar", "event_calendar"),
    ("/api/corporates-financial-results?index=equities", "financial_results_equities"),
    ("/api/corporates-pit-financial-results?index=equities", "pit_financial_results_equities"),
    ("/api/equity-stockIndices?index=NIFTY%2050", "nifty_50"),
    ("/api/market-data-pre-open?key=ALL", "pre_open_all"),
    ("/api/emerge-market-data", "emerge_market_data"),
]

for ep, name in endpoints_to_test:
    url = f"https://www.nseindia.com{ep}"
    print(f"\nTesting {url}...", flush=True)
    try:
        resp = session.get(url, headers=api_headers, timeout=10)
        print(f"  Status: {resp.status_code}, Content-Type: {resp.headers.get('Content-Type')}, Length: {len(resp.content)}")
        if resp.status_code == 200:
            try:
                data = resp.json()
                if isinstance(data, list):
                    print(f"  Success: Received list with {len(data)} items")
                    if data:
                        print(f"  Sample keys: {list(data[0].keys())}")
                        print(f"  Sample item: {json.dumps(data[0], indent=2)[:300]}...")
                elif isinstance(data, dict):
                    print(f"  Success: Received dict with keys: {list(data.keys())}")
                    for k in list(data.keys())[:3]:
                        val = data[k]
                        if isinstance(val, list):
                            print(f"    Key '{k}': list of {len(val)} items")
                            if val and isinstance(val[0], dict):
                                print(f"      Item keys: {list(val[0].keys())}")
                        else:
                            print(f"    Key '{k}': {str(val)[:80]}")
            except Exception as json_err:
                print(f"  Failed to parse JSON: {json_err}, text preview: {resp.text[:150]}")
        else:
            print(f"  Response text preview: {resp.text[:200]}")
    except Exception as e:
        print(f"  Request exception: {e}")
    time.sleep(1) # polite delay
