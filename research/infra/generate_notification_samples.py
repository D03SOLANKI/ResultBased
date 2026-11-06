import json
import os

os.makedirs("research/infra/samples", exist_ok=True)

# 1. Telegram Payload Sample
telegram_html_sample = """<b>🔔 Daily Earnings Scanner | 02-Nov-2026</b>
━━━━━━━━━━━━━━━━━━━━
<b>📅 Results Today (8:00 AM IST Preview)</b>

<b>🏢 LARGE CAP (Top 100)</b>
• <b>RELIANCE</b> (Reliance Industries)
  └ Prev Close: ₹2,845.50 | 1W Move: +2.4% | Cons. PAT Est: ₹18,500 Cr
• <b>TATASTEEL</b> (Tata Steel Ltd.)
  └ Prev Close: ₹148.20 | 1W Move: -1.1% | Key Focus: European spreads

<b>⚡ MID CAP (101 - 250)</b>
• <b>POLYCAB</b> (Polycab India)
  └ Prev Close: ₹6,420.00 | 1W Move: +4.8% | Est. Rev Growth: 18% YoY
• <b>FEDERALBNK</b> (Federal Bank)
  └ Prev Close: ₹195.40 | 1W Move: +0.6% | NIM Expectation: 3.25%

<b>🌱 SMALL CAP (251 - 500)</b>
• <b>CDSL</b> (Central Depository Services)
  └ Prev Close: ₹1,560.00 | 1W Move: +5.2% | Demat additions in focus

<b>🔬 MICRO / SME WATCHLIST</b>
• <b>KRNHEAT</b> (KRN Heat Exchanger) - SME / Microcap
  └ Prev Close: ₹740.00 | First post-listing Q2 results

━━━━━━━━━━━━━━━━━━━━
📊 <b>Summary Statistics:</b>
• Total Companies Reporting Today: <b>28</b>
• Large: 2 | Mid: 4 | Small: 14 | Micro/SME: 8
• Attached: Full Excel & PDF breakdown with 3-year historical beat/miss rate.
🔗 <a href="https://scanner.example.com/daily/2026-11-02">Open Web Dashboard</a> | <a href="https://t.me/ResultScannerBot">Configure Alerts</a>
"""

with open("research/infra/samples/telegram_sample_message.html", "w", encoding="utf-8") as f:
    f.write(telegram_html_sample)

# 2. WhatsApp Cloud API Payload Sample
whatsapp_template_payload = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+919876543210",
    "type": "template",
    "template": {
        "name": "daily_earnings_digest_v1",
        "language": {
            "code": "en"
        },
        "components": [
            {
                "type": "header",
                "parameters": [
                    {
                        "type": "text",
                        "text": "02-Nov-2026"
                    }
                ]
            },
            {
                "type": "body",
                "parameters": [
                    {
                        "type": "text",
                        "text": "28"  # Total results
                    },
                    {
                        "type": "text",
                        "text": "RELIANCE, TATASTEEL"  # Large caps
                    },
                    {
                        "type": "text",
                        "text": "POLYCAB, FEDERALBNK"  # Mid caps
                    },
                    {
                        "type": "text",
                        "text": "CDSL, KRNHEAT"  # Small/Micro caps
                    }
                ]
            },
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {
                        "type": "text",
                        "text": "2026-11-02"
                    }
                ]
            }
        ]
    }
}

with open("research/infra/samples/whatsapp_template_payload.json", "w", encoding="utf-8") as f:
    json.dump(whatsapp_template_payload, f, indent=2)

# 3. Email HTML Sample (Resend / SES payload)
email_html_sample = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
  .card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
  .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge-large { background: #dbeafe; color: #1e40af; }
  .badge-mid { background: #fef3c7; color: #92400e; }
  .badge-small { background: #dcfce7; color: #166534; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 12px; color: #64748b; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .footer { padding: 16px 24px; background: #f8fafc; font-size: 12px; color: #64748b; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2 style="margin:0; font-size: 20px;">Daily Earnings Scanner Report</h2>
    <p style="margin:4px 0 0 0; font-size: 13px; color: #94a3b8;">Trading Date: 02-Nov-2026 | Morning Pre-Market Edition (08:00 AM IST)</p>
  </div>
  <div style="padding: 24px;">
    <h3 style="margin-top:0; font-size: 15px; color: #334155;">Key Results Scheduled Today (Total: 28 Companies)</h3>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Company Name</th>
          <th>Category</th>
          <th>Market Cap</th>
          <th>1W Chg</th>
          <th>Prev Close</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>RELIANCE</b></td>
          <td>Reliance Industries Ltd</td>
          <td><span class="badge badge-large">Large Cap</span></td>
          <td>₹18,73,286 Cr</td>
          <td style="color:#16a34a;">+2.4%</td>
          <td>₹2,845.50</td>
        </tr>
        <tr>
          <td><b>TATASTEEL</b></td>
          <td>Tata Steel Ltd</td>
          <td><span class="badge badge-large">Large Cap</span></td>
          <td>₹1,85,420 Cr</td>
          <td style="color:#dc2626;">-1.1%</td>
          <td>₹148.20</td>
        </tr>
        <tr>
          <td><b>POLYCAB</b></td>
          <td>Polycab India Ltd</td>
          <td><span class="badge badge-mid">Mid Cap</span></td>
          <td>₹96,410 Cr</td>
          <td style="color:#16a34a;">+4.8%</td>
          <td>₹6,420.00</td>
        </tr>
        <tr>
          <td><b>CDSL</b></td>
          <td>Central Depository Services</td>
          <td><span class="badge badge-small">Small Cap</span></td>
          <td>₹32,600 Cr</td>
          <td style="color:#16a34a;">+5.2%</td>
          <td>₹1,560.00</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top: 24px; text-align: center;">
      <a href="https://scanner.example.com" style="background:#2563eb; color:#ffffff; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:500; font-size:14px; display:inline-block;">View Interactive Earnings Calendar</a>
    </div>
  </div>
  <div class="footer">
    Sent by Upcoming Financial Results Scanner • Automated at 08:00 AM IST
  </div>
</div>
</body>
</html>
"""

with open("research/infra/samples/email_sample_template.html", "w", encoding="utf-8") as f:
    f.write(email_html_sample)

print("Generated sample notification payloads:")
print(" - research/infra/samples/telegram_sample_message.html")
print(" - research/infra/samples/whatsapp_template_payload.json")
print(" - research/infra/samples/email_sample_template.html")
