import urllib.request
import ssl
from bs4 import BeautifulSoup

url = 'https://www.amfiindia.com'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        soup = BeautifulSoup(html, 'html.parser')
        print("Homepage links matching other-data or research:")
        for a in soup.find_all('a', href=True):
            href = a['href']
            text = a.get_text(strip=True)
            if any(k in href.lower() or k in text.lower() for k in ['other-data', 'categor', 'market-cap', 'cap']):
                print(f"  [{text}] -> {href}")
except Exception as e:
    print("Error:", e)
