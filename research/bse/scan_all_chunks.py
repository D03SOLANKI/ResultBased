from curl_cffi import requests
import re
import concurrent.futures

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

# Get list of chunks from main js
r = s.get("https://www.bseindia.com/assets/includenew/js/main-NYXWOXBN.js", headers=headers)
chunks = sorted(list(set(re.findall(r'chunk-[A-Za-z0-9]+\.js', r.text))))

print(f"Scanning {len(chunks)} chunk files...")

base_url = "https://www.bseindia.com/assets/includenew/js/"

results = {}

def check_chunk(ch):
    try:
        res = s.get(base_url + ch, headers=headers, timeout=10)
        text = res.text
        # Search for api calls, URLs, or endpoints
        endpoints = re.findall(r'["\'](?:https?://api\.bseindia\.com/[^"\']+|/BseIndiaAPI/[^"\']+|API/api/[^"\']+|api/[^"\']+)["\']', text, re.IGNORECASE)
        # Search for keywords
        keywords = {}
        for kw in ["BoardMeeting", "AnnGetData", "List_Scrips", "ListofScrip", "Result", "Forthcoming", "CorpAction"]:
            kw_matches = re.findall(rf'["\'][^"\']*{kw}[^"\']*["\']', text, re.IGNORECASE)
            if kw_matches:
                keywords[kw] = kw_matches[:5]
        return ch, endpoints, keywords
    except Exception as e:
        return ch, [], {}

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(check_chunk, ch) for ch in chunks]
    for fut in concurrent.futures.as_completed(futures):
        ch, endpoints, keywords = fut.result()
        if endpoints or keywords:
            print(f"\n=== Chunk: {ch} ===")
            if endpoints:
                print("Endpoints:", endpoints[:10])
            for k, v in keywords.items():
                print(f"Keyword {k}: {v}")
