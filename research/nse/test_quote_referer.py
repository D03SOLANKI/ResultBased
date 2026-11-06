from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE',
}

session = cffi_requests.Session(impersonate="chrome120")
session.get("https://www.nseindia.com", headers=headers, timeout=10)

r = session.get("https://www.nseindia.com/api/quote-equity?symbol=RELIANCE", headers=headers, timeout=5)
print(f"Quote with Referer: Status {r.status_code}, Length {len(r.content)}")
if r.status_code == 200:
    d = r.json()
    print("Quote keys:", list(d.keys()))
    print("info:", d.get('info'))
