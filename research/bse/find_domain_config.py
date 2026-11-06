from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

t = s.get("https://www.bseindia.com/assets/includenew/js/chunk-FNXB6ADB.js", headers=headers).text

for m in re.finditer(r'BSE_Domain[A-Za-z0-9_]*', t):
    idx = m.start()
    print(t[max(0, idx-50):min(len(t), idx+100)])
    print("-" * 30)

# Also let's search in main-NYXWOXBN.js
t_main = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers).text
for m in re.finditer(r'BSE_Domain[A-Za-z0-9_]*', t_main):
    idx = m.start()
    print(t_main[max(0, idx-50):min(len(t_main), idx+100)])
    print("-" * 30)
