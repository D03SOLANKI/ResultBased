import re
from curl_cffi import requests
from bs4 import BeautifulSoup

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

pages = [
    "https://www.bseindia.com/corporates/ann.html",
    "https://www.bseindia.com/corporates/board_meetings.aspx",
    "https://www.bseindia.com/corporates/forth_results.aspx",
    "https://www.bseindia.com/corporates/List_Scrips.html",
    "https://www.bseindia.com/corporates/Comp_Results.html"
]

for p in pages:
    try:
        r = s.get(p, headers=headers, timeout=15)
        print(f"{p} -> Status: {r.status_code}, Length: {len(r.text)}")
        
        soup = BeautifulSoup(r.text, "html.parser")
        scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]
        print(f"Scripts in {p}: {scripts[:5]}")
        
        # Search for api calls or ajax in page text
        apis = re.findall(r"https?://api\.bseindia\.com[^\s\'\"\`]+|/BseIndiaAPI/[^\s\'\"\`]+|api/[A-Za-z0-9_/]+", r.text)
        print(f"APIs in page {p}: {set(apis)}")
    except Exception as e:
        print(f"{p} -> Error: {e}")
