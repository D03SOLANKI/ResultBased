import sys
import requests
from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

print("Testing requests session initialization...", flush=True)
s = requests.Session()
s.headers.update(headers)
try:
    r = s.get("https://www.nseindia.com", timeout=5)
    print(f"requests: status {r.status_code}, cookies: {dict(r.cookies)}", flush=True)
except Exception as e:
    print(f"requests failed: {e}", flush=True)

print("Testing curl_cffi session initialization...", flush=True)
cs = cffi_requests.Session(impersonate="chrome120")
try:
    r = cs.get("https://www.nseindia.com", headers=headers, timeout=5)
    print(f"curl_cffi: status {r.status_code}, cookies: {dict(cs.cookies)}", flush=True)
except Exception as e:
    print(f"curl_cffi failed: {e}", flush=True)
