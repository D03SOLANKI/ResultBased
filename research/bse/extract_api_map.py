from curl_cffi import requests
import re
import json

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

t = s.get("https://www.bseindia.com/assets/includenew/js/chunk-FNXB6ADB.js", headers=headers).text

# Find where the object starts and ends
# Look for pattern: {corprateResult:...} or similar
matches = re.findall(r'\{[^{}]*(?:boardMeeting|Corp_Fetch_BoardMeeting)[^{}]*\}', t)
print(f"Matches count: {len(matches)}")
for m in matches:
    print(m[:1000])
    print("="*50)

# Also let's extract all key: value pairs where value is "/.../w"
api_map = dict(re.findall(r'([A-Za-z0-9_]+)\s*:\s*["\'](/[^"\']+/w)["\']', t))
print(f"Total API routes found: {len(api_map)}")
with open("research/bse/discovered_api_routes.json", "w") as f:
    json.dump(api_map, f, indent=2)

for k, v in sorted(api_map.items()):
    if any(term in k.lower() for term in ["board", "result", "scrip", "forth", "corp", "ann"]):
        print(f"  {k}: {v}")
