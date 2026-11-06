from curl_cffi import requests
import re

s = requests.Session(impersonate="chrome120")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
}

txt = s.get("https://www.bseindia.com/assets/includenew/js/chunk-TEK3LNPV.js", headers=headers).text
idx = txt.find("Corp_DownloadBoardMeetingCsvlng_ng")
if idx != -1:
    print(txt[max(0, idx-300):min(len(txt), idx+2000)])
