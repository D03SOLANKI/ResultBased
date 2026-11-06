from curl_cffi import requests
import os

os.makedirs("research/bse/samples", exist_ok=True)

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

feeds = [
    ("announcements_feed", "/data/xml/announcements.aspx"),
    ("corp_action_feed", "/data/XML/CorpActionFeed.aspx"),
    ("board_meetings_feed", "/Data/XML/BoardMeetingsFeed.aspx"),
    ("financial_results_feed", "/Data/XML/FinancialResultsFeed.aspx"),
    ("notices_feed", "/data/xml/notices.xml"),
    ("sensex_rss", "/data/xml/sensexrss.xml")
]

for name, f in feeds:
    url = f"https://www.bseindia.com{f}"
    try:
        r = s.get(url, headers=headers, timeout=15)
        print(f"{name} ({url}) -> Status: {r.status_code}, Length: {len(r.text)}, Content-Type: {r.headers.get('content-type')}")
        if r.status_code == 200:
            sample_path = f"research/bse/samples/{name}.xml"
            with open(sample_path, "w", encoding="utf-8") as out:
                out.write(r.text)
            print(f"Saved sample to {sample_path}")
            print("Preview:", r.text[:250].replace("\n", " "))
        else:
            print("Error body:", r.text[:200])
    except Exception as e:
        print(f"Error fetching {name}: {e}")
