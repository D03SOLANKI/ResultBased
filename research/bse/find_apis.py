from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

files = [
    "https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js",
    "https://www.bseindia.com/assets/includenew/js/scripts-DS3I3X7Y.js"
]

for url in files:
    print(f"\nScanning {url}...")
    r = s.get(url, headers=headers)
    txt = r.text
    print(f"Length: {len(txt)}")
    
    # search for api endpoints
    patterns = [
        r'https?://api\.bseindia\.com/[a-zA-Z0-9_\-\./\?&=%]+',
        r'https?://[a-zA-Z0-9_\-\.]+\.bseindia\.com/[a-zA-Z0-9_\-\./\?&=%]+',
        r'/BseIndiaAPI/[a-zA-Z0-9_\-\./\?&=%]+',
        r'api/[a-zA-Z0-9_\-\./\?&=%]+',
        r'[A-Za-z0-9_]+GetData/[a-zA-Z0-9_\-\./\?&=%]+',
        r'[A-Za-z0-9_]+Meeting[a-zA-Z0-9_\-\./\?&=%]*',
    ]
    for p in patterns:
        found = set(re.findall(p, txt, re.IGNORECASE))
        if found:
            print(f"Pattern '{p}': {len(found)} matches")
            for m in list(found)[:10]:
                print(f"   {m}")
