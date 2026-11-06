from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

t_main = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers).text

# Look for json configs or assets/config or similar
configs = re.findall(r'["\'][^"\']*\.json["\']', t_main)
print("JSON files referenced:", configs)

# Search for BSE_Domain in main
for m in re.finditer(r'BSE_Domain_APIUrl', t_main):
    idx = m.start()
    snippet = t_main[max(0, idx-200):min(len(t_main), idx+200)]
    if "http" in snippet or "config" in snippet or "env" in snippet:
        print("CONFIG SNIPPET:", snippet)
        print("="*40)
