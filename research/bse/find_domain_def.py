from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

# Search in main and all chunks
files = ["main-NYXWOXBN.js", "scripts-DS3I3X7Y.js"]

r = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers)
chunks = sorted(list(set(re.findall(r'chunk-[A-Za-z0-9]+\.js', r.text))))

for fname in ["main-NYXWOXBN.js"] + chunks:
    txt = s.get("https://www.bseindia.com/assets/includenew/js/" + fname, headers=headers).text
    matches = re.findall(r'BSE_Domain_APIUrl[^;,\}]{0,100}', txt)
    if matches:
        print(f"File {fname}:")
        for m in matches[:5]:
            print("  ", m)
