import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

urls = [
    "https://nsearchives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv",
    "https://nsearchives.nseindia.com/content/equities/List_of_Active_Securities_CM_DEBT.csv",
]

for url in urls:
    r = requests.get(url, headers=headers, timeout=10)
    print(f"URL: {url}")
    print(f"Status: {r.status_code}, Length: {len(r.content)}")
    if r.status_code == 200:
        lines = r.text.strip().splitlines()
        print(f"Header: {lines[0] if lines else 'empty'}")
        print(f"Total lines: {len(lines)}")
        if len(lines) > 1:
            print(f"Sample row 1: {lines[1]}")
            print(f"Sample row 2: {lines[2] if len(lines) > 2 else ''}")
