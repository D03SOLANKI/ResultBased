from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

r = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers)
chunks = sorted(list(set(re.findall(r'chunk-[A-Za-z0-9]+\.js', r.text))))

for ch in chunks:
    txt = s.get("https://www.bseindia.com/assets/includenew/js/" + ch, headers=headers).text
    if "Corp_Fetch_BoardMeeting" in txt and "chunk-FNXB6ADB.js" not in ch:
        print(f"FOUND IN: {ch}")
        for m in re.finditer(r'Corp_Fetch_BoardMeeting[A-Za-z0-9_]*', txt):
            idx = m.start()
            print(txt[max(0, idx-200):min(len(txt), idx+800)])
            print("="*40)
