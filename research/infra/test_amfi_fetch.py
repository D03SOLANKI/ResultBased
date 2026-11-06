import urllib.request
import ssl
import re
from bs4 import BeautifulSoup
import json

url = 'https://www.amfiindia.com/research-information/other-data/categorisation-of-large-mid-and-small-cap-stocks'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Page fetched successfully! Length: {len(html)}")
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            text = a.get_text(strip=True)
            if any(ext in href.lower() for ext in ['.xls', '.xlsx', '.pdf', 'categorisation', 'market-cap', 'cap', 'otherdata', 'download']):
                links.append({'text': text, 'href': href})
        print(f"Found {len(links)} matching links:")
        for l in links[:30]:
            print(f"  [{l['text']}] -> {l['href']}")
except Exception as e:
    print(f"Fetch error: {e}")

