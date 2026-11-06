from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
}

cs = cffi_requests.Session(impersonate="chrome120")
# Direct request to API without visiting homepage first:
r = cs.get("https://www.nseindia.com/api/event-calendar", headers=headers, timeout=5)
print(f"Direct API call without session init: Status {r.status_code}, Length {len(r.content)}")
print(f"Cookies after direct call: {list(cs.cookies.keys())}")
print(f"Body preview: {r.text[:200]}")
