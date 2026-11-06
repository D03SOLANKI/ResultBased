import json
import requests
from curl_cffi import requests as cffi_requests

# Let's inspect SME_EQUITY_L.csv content
r = requests.get("https://nsearchives.nseindia.com/content/equities/SME_EQUITY_L.csv")
print("SME_EQUITY_L.csv content:")
print(r.text)

print("\n--- Testing NSE website session initialization ---")

# Try with requests first, then curl_cffi
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

session = cffi_requests.Session(impersonate="chrome120")
resp = session.get("https://www.nseindia.com", headers=headers, timeout=15)
print(f"Homepage status: {resp.status_code}")
print(f"Cookies received: {list(session.cookies.keys())}")

# Test some known NSE API endpoints
test_endpoints = [
    "/api/corporate-board-meetings?index=equities",
    "/api/corporate-announcements?index=equities",
    "/api/event-calendar",
    "/api/corporates-financial-results?index=equities",
    "/api/equity-stockIndices?index=NIFTY%2050",
    "/api/master-quote",
    "/api/market-data-pre-open?key=ALL",
    "/api/emerge-market-data",
    "/api/liveEquity-derivatives?index=nse50_opt",
    "/api/next-events",
]

api_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/companies-listing/corporate-filings-board-meetings',
}

for ep in test_endpoints:
    url = f"https://www.nseindia.com{ep}"
    try:
        api_resp = session.get(url, headers=api_headers, timeout=10)
        print(f"{ep} -> Status: {api_resp.status_code}, Length: {len(api_resp.content)}, Content-Type: {api_resp.headers.get('Content-Type')}")
        if api_resp.status_code == 200:
            try:
                data = api_resp.json()
                if isinstance(data, list):
                    print(f"   -> JSON list with {len(data)} items")
                    if len(data) > 0:
                        print(f"   -> Sample item keys: {list(data[0].keys()) if isinstance(data[0], dict) else data[0]}")
                elif isinstance(data, dict):
                    print(f"   -> JSON dict with keys: {list(data.keys())[:10]}")
            except Exception as e:
                print(f"   -> Non-json preview: {api_resp.text[:100]}")
        else:
            print(f"   -> Error preview: {api_resp.text[:100]}")
    except Exception as e:
        print(f"{ep} -> Exception: {e}")
