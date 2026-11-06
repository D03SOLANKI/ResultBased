from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
}

session = cffi_requests.Session(impersonate="chrome120")
session.get("https://www.nseindia.com", headers=headers, timeout=10)

test_eps = [
    "/api/equity-stockIndices?index=NIFTY%2050",
    "/api/equity-stockIndices?index=NIFTY%2050",
    "/api/equity-master",
    "/api/market-data-pre-open?key=NIFTY",
    "/api/quote-equity?symbol=RELIANCE",
    "/api/quote-equity?symbol=TCS&section=trade_info",
]

for ep in test_eps:
    r = session.get(f"https://www.nseindia.com{ep}", headers=headers, timeout=5)
    print(f"{ep} -> Status: {r.status_code}, Length: {len(r.content)}")
    if r.status_code == 200:
        try:
            d = r.json()
            print(f"   Keys: {list(d.keys())[:8] if isinstance(d, dict) else len(d)}")
        except:
            print(f"   Text: {r.text[:80]}")
