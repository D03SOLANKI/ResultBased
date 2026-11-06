import json
import time
from playwright.sync_api import sync_playwright

pages_to_test = [
    {
        "name": "list_scrips",
        "url": "https://www.bseindia.com/corporates/List_Scrips.html",
        "wait_sel": "table"
    },
    {
        "name": "board_meetings",
        "url": "https://www.bseindia.com/corporates/board_meetings.aspx",
        "wait_sel": "table"
    },
    {
        "name": "forth_results",
        "url": "https://www.bseindia.com/corporates/forth_results.aspx",
        "wait_sel": "table"
    },
    {
        "name": "announcements",
        "url": "https://www.bseindia.com/corporates/ann.html",
        "wait_sel": "table"
    },
    {
        "name": "comp_results",
        "url": "https://www.bseindia.com/corporates/Comp_Results.html",
        "wait_sel": "table"
    }
]

captured = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    page = context.new_page()

    def handle_response(response):
        req = response.request
        url = req.url
        if any(k in url.lower() for k in ["api", "bseindia", "scrip", "board", "result", "ann"]):
            # Filter out images, fonts, static assets unless json/api
            if any(ext in url.lower() for ext in [".png", ".jpg", ".svg", ".css", ".woff", ".ico"]):
                return
            headers = dict(req.headers)
            body = None
            try:
                ct = response.headers.get("content-type", "")
                if "json" in ct or "text" in ct or "csv" in ct:
                    body = response.text()[:2000]
            except Exception:
                pass
            captured.append({
                "page": current_page_name,
                "url": url,
                "method": req.method,
                "post_data": req.post_data,
                "status": response.status,
                "content_type": response.headers.get("content-type", ""),
                "body_preview": body[:500] if body else None
            })

    page.on("response", handle_response)

    for item in pages_to_test:
        current_page_name = item["name"]
        print(f"\n--- Loading {item['name']}: {item['url']} ---")
        try:
            page.goto(item["url"], wait_until="networkidle", timeout=30000)
            time.sleep(3)
        except Exception as e:
            print(f"Error loading {item['name']}: {e}")

    browser.close()

with open("research/bse/sniffed_network.json", "w", encoding="utf-8") as f:
    json.dump(captured, f, indent=2)

print(f"\nFinished! Captured {len(captured)} requests.")
for c in captured:
    if "api" in c["url"].lower() or "aspx" in c["url"].lower() or "csv" in c["url"].lower():
        print(f"[{c['page']}] {c['method']} {c['url']} -> {c['status']}")
