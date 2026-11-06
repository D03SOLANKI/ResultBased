from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

r = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers)
txt = r.text

chunks = set(re.findall(r'chunk-[A-Za-z0-9]+\.js', txt))
print(f"Total chunk files found: {len(chunks)}")
print(sorted(chunks)[:20])
