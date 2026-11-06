from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

r = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers)
chunks = sorted(list(set(re.findall(r'chunk-[A-Za-z0-9]+\.js', r.text))))

base_url = "https://www.bseindia.com/assets/includenew/js/"

for ch in chunks:
    res = s.get(base_url + ch, headers=headers, timeout=10)
    t = res.text
    for kw in ["Forth_Results", "List_Scrips", "BoardMeeting", "board_meeting", "Comp_Results"]:
        if kw.lower() in t.lower():
            print(f"Chunk {ch} contains keyword {kw}!")
            # Find any URLs or API calls
            apis = re.findall(r'["\'](/BseIndiaAPI/[^"\']+|https?://api\.bseindia\.com/[^"\']+|/API/[^"\']+|api/[^"\']+)["\']', t, re.IGNORECASE)
            if apis:
                print("   Found APIs:", apis)
            # Find any http or https
            urls = re.findall(r'https?://[a-zA-Z0-9_\-\./\?&=%]+', t)
            bse_urls = [u for u in urls if "bse" in u.lower()]
            if bse_urls:
                print("   BSE URLs:", set(bse_urls))
