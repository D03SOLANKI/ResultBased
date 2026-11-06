from curl_cffi import requests
import json

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

test_endpoints = [
    # 1. Scrips
    ("ListofScripData", "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active"),
    ("ListofScripData_alt", "https://api.bseindia.com/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active"),
    ("LitsOfScripCSVDownload", "https://api.bseindia.com/BseIndiaAPI/api/LitsOfScripCSVDownload/w?Group=&Scripcode=&segment=Equity&status=Active"),
    
    # 2. Board Meetings / Forthcoming
    ("BoardMeeting", "https://api.bseindia.com/BseIndiaAPI/api/BoardMeeting/w"),
    ("Corp_Fetch_BoardMeeting_With_Filter_ng", "https://api.bseindia.com/BseIndiaAPI/api/Corp_Fetch_BoardMeeting_With_Filter_ng/w"),
    ("Corp_Fetch_BoardMeetingFilter_ng", "https://api.bseindia.com/BseIndiaAPI/api/Corp_Fetch_BoardMeetingFilter_ng/w"),
    ("Corpforthresults", "https://api.bseindia.com/BseIndiaAPI/api/Corpforthresults/w"),
    ("CorpSearchForthBoardMeeting", "https://api.bseindia.com/BseIndiaAPI/api/CorpSearchForthBoardMeeting/w"),
    ("GetBoardPurposeMaster", "https://api.bseindia.com/BseIndiaAPI/api/Corp_GetBoardPurposeMaster_ng/w"),
    
    # 3. Announcements
    ("AnnSubCategoryGetData", "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate=20261101&strScrip=&strSearch=P&strToDate=20261102&strType=C&subcategory="),
    ("CorpAnnouncementDTNewDataBeta", "https://api.bseindia.com/BseIndiaAPI/api/CorpAnnouncementDTNewDataBeta/w"),
    ("Corp_Ann_CORPCAT_DD_ng", "https://api.bseindia.com/BseIndiaAPI/api/Corp_Ann_CORPCAT_DD_ng/w"),
    ("Corp_Archive_Wthxml_ng", "https://api.bseindia.com/BseIndiaAPI/api/Corp_Archive_Wthxml_ng/w"),
    
    # 4. Results
    ("Corp_FinanceResult_ng", "https://api.bseindia.com/BseIndiaAPI/api/Corp_FinanceResult_ng/w"),
    ("FinancialResult", "https://api.bseindia.com/BseIndiaAPI/api/FinancialResult/w"),
]

for name, url in test_endpoints:
    try:
        r = s.get(url, headers=headers, timeout=10)
        print(f"[{name}] Status: {r.status_code}, Length: {len(r.text)}, Content-Type: {r.headers.get('content-type')}")
        print("   Snippet:", r.text[:200].replace("\n", " "))
        if r.status_code == 200 and len(r.text) > 5:
            with open(f"research/bse/samples/{name}.json", "w", encoding="utf-8") as f:
                f.write(r.text)
            print(f"   Saved to research/bse/samples/{name}.json")
    except Exception as e:
        print(f"[{name}] Error: {e}")
