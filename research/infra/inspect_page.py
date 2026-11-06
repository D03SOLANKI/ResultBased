import urllib.request, ssl, re, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://www.amfiindia.com/otherdata', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8', errors='ignore')

print("HTML length:", len(html))
next_data = re.search(r'__NEXT_DATA__\s*=\s*({.*?});?</script>', html, re.DOTALL)
if next_data:
    print("Found __NEXT_DATA__!")
    try:
        data = json.loads(next_data.group(1))
        print("Keys:", list(data.keys()))
        pageProps = data.get('props', {}).get('pageProps', {})
        print("pageProps keys:", list(pageProps.keys()))
        s = json.dumps(pageProps, indent=2)
        print("pageProps snippet:", s[:1500])
    except Exception as e:
        print("JSON parse error:", e)
else:
    print("Searching for categorisation / excel in raw html...")
    matches = re.findall(r'https?://[^\s"\'<>]+(?:xlsx|xls|pdf)', html)
    print("Matches:", matches)
    print("HTML excerpt:\n", html[:1500])
