from curl_cffi import requests
import re
import json

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

r = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers)
print("main js length:", len(r.text))

# Search for api urls or patterns
urls = set(re.findall(r'https?://[a-zA-Z0-9_\-\.]+(?:/[a-zA-Z0-9_\-\.\?&=%+~#]+)+', r.text))
bse_apis = [u for u in urls if "bseindia" in u or "api" in u]
print(f"Total urls: {len(urls)}, BSE/API urls: {len(bse_apis)}")
for u in sorted(bse_apis):
    if any(k in u.lower() for k in ["board", "ann", "result", "scrip", "corp"]):
        print("MATCH:", u)

# Also search for endpoint paths like api/... or BseIndiaAPI/...
paths = set(re.findall(r'["\'](?:/BseIndiaAPI/[^"\']+|api/[^"\']+)["\']', r.text))
print("Matched paths:", len(paths))
for p in sorted(paths):
    if any(k in p.lower() for k in ["board", "ann", "result", "scrip", "corp", "get"]):
        print("PATH:", p)
