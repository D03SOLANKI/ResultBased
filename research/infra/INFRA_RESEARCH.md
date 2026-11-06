# Supporting Services & Infrastructure Architecture Report
**Upcoming Financial Results Scanner**  
**Author:** Subagent D (Supporting Services & Infrastructure Specialist)  
**Date:** November 2026  
**Status:** Approved & Grounded with Production Samples  

---

## 1. Executive Summary

This report establishes the technical architecture, operational costs, and implementation blueprints for three mission-critical pillars of the **Upcoming Financial Results Scanner**:
1. **Market-Cap Data Sourcing & Equity Classification:** Establishing an automated, zero-marginal-cost pipeline utilizing the official **AMFI (Association of Mutual Funds in India)** semi-annual classification engine, augmented by exchange Bhavcopy masters.
2. **Notification Delivery Channels:** Designing a dual-tier dispatch engine capable of sending daily 8:00 AM IST pre-market earnings reports to subscribers via **Telegram Bot API** (Free, instant, rich attachments) and **Transactional Email (Resend / Amazon SES)**, while reserving **WhatsApp Business API** as a premium paid add-on due to unit economics.
3. **Infrastructure & Hosting Architecture:** Formulating a high-reliability, low-overhead compute topology comparing **Hetzner Cloud / AWS Lightsail VPS** with **Serverless (AWS Lambda / GitHub Actions)**, demonstrating that an MVP can operate for **$0 to $4.10 / month**, while a fully scaled production service serving 10,000+ active subscribers costs only **$16 to $35 / month**.

---

## 2. Market-Cap Data Sources & Classification

### 2.1 The Official AMFI Semi-Annual Classification Framework

In India, equity market-capitalization tiers are governed by the Securities and Exchange Board of India (**SEBI**) circular **`SEBI/HO/IMD/DF3/CIR/P/2017/114`** dated October 6, 2017. Under this regulation, AMFI is mandated to compute and publish the official ranking and classification of all listed companies twice every calendar year.

#### 1. Publishing Cycle & Schedule
* **Cycle:** Semi-annual (every 6 months).
  * **July Release:** Covers average daily market capitalization for the 6-month period from **January 1 to June 30**. Effective for the subsequent half-year (August to January).
  * **January Release:** Covers average daily market capitalization for the 6-month period from **July 1 to December 31**. Effective for the subsequent half-year (February to July).
* **Data Compilation:** Prepared by aggregating daily trading turnover and market capitalization across **BSE**, **NSE**, and **MSEI**. If a company is listed on multiple exchanges, the average of total market capitalization across all active exchanges is used.

#### 2. Official Portal & Scraping Endpoint
* **Web Portal:** `https://www.amfiindia.com/otherdata/categorisation-of-stocks`  
  *(Note: AMFI migrated to a Next.js App Router front-end, relocating historical data from legacy `/research-information/other-data` paths to `/otherdata/categorisation-of-stocks`).*
* **Direct Asset Endpoints:**
  * Latest active period (H1 2026): `https://portal.amfiindia.com/spages/AverageMarketCapitalization30Jun2026.xlsx`
  * Prior semi-annual archive (H2 2025): `https://www.amfiindia.com/Themes/Theme1/downloads/AverageMarketCapitalization31Dec2025.xlsx`
* **File Format:** Microsoft Excel (`.xlsx` / `.xls`) and Adobe PDF (`.pdf`).
* **Header Structure:** Header text is located at index row `1` of sheet `'FINAL'`.

```
Columns:
[0] Sr. No.                                          -> Integer Rank (1 to N)
[1] Company name                                     -> Registered Corporate Name
[2] ISIN                                             -> 12-character International Securities ID
[3] BSE Symbol                                       -> BSE Scrip ID
[4] BSE 6 month Avg Total Market Cap in (Rs. Crs.)  -> Float
[5] NSE Symbol                                       -> NSE Trading Symbol
[6] NSE 6 month Avg Total Market Cap (Rs. Crs.)     -> Float
[7] MSEI Symbol                                      -> MSEI Symbol (or '-')
[8] MSEI 6 month Avg Total Market Cap in (Rs Crs.)  -> Float
[9] Average of All Exchanges (Rs. Cr.)               -> Benchmark Market Cap
[10] Categorization as per SEBI Circular Oct 6 2017  -> 'Large Cap', 'Mid Cap', 'Small Cap'
```

#### 3. Grounded Dataset Metrics (June 30, 2026 Snapshot)
From our live downloaded dataset (`research/infra/samples/amfi_market_cap_30Jun2026.xlsx`):
* **Total Listed Companies Mapped:** **5,427 companies**.
* **SEBI Categorization Thresholds:**
  * **Large Cap:** Ranks **1st to 100th** (100 companies). Cutoff: **₹1,06,346.15 Cr** (GAIL India Ltd.).
  * **Mid Cap:** Ranks **101st to 250th** (150 companies). Cutoff: **₹33,664.21 Cr** (Godrej Industries Ltd.).
  * **Small Cap:** Ranks **251st and beyond** (5,177 companies). Spanning from ₹33,441 Cr down to ₹0.02 Cr.

---

### 2.2 Granular Classification: Micro-Cap, Nano-Cap & SME Methodology

While SEBI regulations formally bucket all stocks beyond rank 250 into "Small Cap", institutional asset managers, quant desks, and indices (such as the **Nifty Smallcap 250** and **Nifty Microcap 250**) apply sub-categorization to separate liquid trading candidates from illiquid penny stocks.

Our recommended multi-tier taxonomy for the Scanner:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EQUITY UNIVERSE TAXONOMY                               │
├─────────────┬──────────────┬────────────────────────────┬──────────────────────────────┤
│ Tier        │ Rank Range   │ Mcap Threshold (June 2026) │ Reporting / Liquidity Profile│
├─────────────┼──────────────┼────────────────────────────┼──────────────────────────────┤
│ Large Cap   │ 1 to 100     │ > ₹1,06,346 Cr             │ F&O eligible, high analyst   │
│             │              │                            │ coverage, quarterly results  │
│ Mid Cap     │ 101 to 250   │ ₹33,664 Cr – ₹1,06,346 Cr  │ High institutional interest, │
│             │              │                            │ active institutional calls   │
│ Small Cap   │ 251 to 500   │ ₹12,200 Cr – ₹33,664 Cr    │ Institutional research coverage,│
│ (Core)      │              │                            │ high alpha potential         │
│ Micro Cap   │ 501 to 1,000 │ ₹2,840 Cr – ₹12,200 Cr     │ High retail / HNIs, emerging │
│             │              │                            │ high-growth candidates       │
│ Nano Cap    │ 1,001+       │ < ₹2,840 Cr                │ Illiquid, surveillance ASM/  │
│             │              │                            │ GSM watchlist candidates     │
├─────────────┼──────────────┴────────────────────────────┴──────────────────────────────┤
│ SME Platform│ Stocks listed on NSE Emerge (Series SM/ST) or BSE SME (Group M/MT)       │
│             │ * Distinct regulatory regime: Semi-annual reporting (no Q1/Q3 mandated)! │
│             │ * Fixed minimum lot trading (₹1.00L to ₹1.50L lot size)                  │
└─────────────┴──────────────────────────────────────────────────────────────────────────┘
```

#### SME Platform Specifics (NSE Emerge & BSE SME)
1. **Financial Reporting Frequency:** Unlike mainboard companies that must declare financial results within 45 days of the end of each quarter (Q1, Q2, Q3, Q4), SME companies under SEBI ICDR regulations are only required to report **half-yearly results** (H1 ending September 30, and H2 ending March 31).
2. **Identification Mechanism:**
   * NSE: Listed with series code `SM` (Normal settlement) or `ST` (Trade-to-Trade).
   * BSE: Listed in group `M` or `MT`.
   * The scanner engine must tag SME stocks with a specialized badge: `[SME - Half-Yearly]` to avoid user confusion when no quarterly results appear in July (Q1) or January (Q3).

---

### 2.3 Alternative Market-Cap Data Sources Comparison

| Source | Update Frequency | Multi-Exchange Mapping | Pros | Cons / Risks | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Official AMFI Sheet** | Semi-Annual (Jan / Jul) | **Yes** (ISIN + BSE + NSE + MSEI mapped in 1 row) | Gold standard for SEBI classification; zero cost; single static download; 5,427 stocks mapped. | Semi-annual lag; does not capture intra-month hyper-rallies. | **Primary Master Source** for company categorization & ISIN cross-reference. |
| **BSE Bhavcopy + Master (`Equity.csv`)** | Daily (end of day) | BSE Only (Scrip Code & Name) | Contains exact total shares outstanding and daily closing price (`Close * Shares = Live Mcap`). | Requires downloading daily zip archives; BSE scrip codes differ from NSE symbols. | **Secondary Enrichment Source** to calculate live market-cap drift between AMFI cycles. |
| **NSE Bhavcopy + `EQUITY_L.csv`** | Daily (end of day) | NSE Only | Clean ticker symbols; identifies Series (`EQ`, `BE`, `SM`, `ST`). | Does not list BSE-only companies (over 1,500 listed exclusively on BSE). | **Secondary Enrichment Source** for NSE series detection and volume tracking. |
| **Yahoo Finance (`yfinance`)** | Real-time / 15m delay | Symbol suffix (`.NS`, `.BO`) | Provides instant `marketCap`, `sector`, `beta`. | High latency; severe rate-limiting when scanning 500+ Indian tickers; frequent Yahoo API breakages. | **Fallback only** for ad-hoc single-stock queries. Never use for batch ETL. |
| **Screener.in Scraper** | Daily | NSE/BSE | Rich fundamental metrics (PE, ROCE, Sales Growth). | Violates ToS if scraped at scale; Cloudflare bot-mitigation triggers CAPTCHA blocks. | **Not recommended** for automated infrastructure pipelines. |

---

### 2.4 Data Pipeline & Classification Engine Architecture

The Python module `research/infra/amfi_classifier.py` has been built and tested. It implements:
1. Dynamic discovery of the latest AMFI URL via HTTP header inspections.
2. Robust parsing with SSL fallbacks and column normalization.
3. Multi-tier classification logic generating `Large Cap`, `Mid Cap`, `Small Cap`, `Micro Cap`, and `Nano Cap`.

```
┌────────────────────────────────────────────────────────┐
│                DATA INGESTION WORKFLOW                 │
└────────────────────────────────────────────────────────┘
                           │
       (Runs 1st of January & 1st of July)
                           ▼
  [AMFI Web Scraper: discover_latest_amfi_excel_url()]
                           │
                           ▼
  [Download .xlsx -> Parse Sheet 'FINAL' via Pandas]
                           │
                           ▼
  [Normalize Columns: ISIN, BSE, NSE, MSEI, Avg Mcap]
                           │
                           ▼
  [Assign Classification Tiers (Large/Mid/Small/Micro)]
                           │
                           ▼
  [Upsert into DB: master_equities table (PostgreSQL/SQLite)]
                           │
                           ▼
  (Daily 7:00 AM IST: Joins with Exchange Daily Bhavcopy
   to refresh previous day close and 1-week price change)
```

---

## 3. Notification Delivery Channels for Daily 8:00 AM IST Reports

The scanner requires automated distribution of morning pre-market briefs every trading day at **08:00 AM IST** (1 hour and 15 minutes before market open at 09:15 AM IST).

### 3.1 WhatsApp Business API (Cloud API vs BSPs)

#### 1. Direct Meta Cloud API vs Business Solution Providers (BSPs)
* **Direct Meta Cloud API:** Free integration layer hosted directly on Meta's infrastructure. No monthly SaaS markup, but requires handling webhooks, token lifecycles, and direct API error handling.
* **BSPs (Twilio, Gupshup, Wati, Interakt):** Wrap Meta’s API in a management dashboard. They charge an extra **$20 to $49/month platform fee**, plus a **₹0.05 to ₹0.20 per message markup** over Meta's base rate card.

#### 2. Pricing & Cost Model (India Market Rate Card 2025/2026)
Meta charges per delivered message template in Indian Rupees (+ 18% GST):
* **Marketing Message Rate:** **₹0.8631** (~$0.0103) per message.
  *(A daily automated push notifying subscribers of upcoming earnings without an existing customer-initiated 24-hr session is legally classified as **Marketing** by Meta).*
* **Utility Message Rate:** **₹0.1150** (~$0.0014) per message.
  *(Only allowed for explicit account alerts, password resets, or transactional confirmations. Using Utility for daily alerts risks template rejection or template category re-classification by Meta).*
* **Cost Projection for Daily Scanner:**
  * Schedule: 22 trading days per month.
  * Message volume: 1 message per subscriber per morning.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHATSAPP MONTHLY COST PROJECTION                     │
├─────────────┬───────────────────┬───────────────────┬───────────────────┤
│ Subscribers │ Monthly Deliveries│ Meta Fees (₹0.86) │ USD Equivalent    │
├─────────────┼───────────────────┼───────────────────┼───────────────────┤
│ 100         │ 2,200             │ ₹1,898.82         │ $22.75 / mo       │
│ 500         │ 11,000            │ ₹9,494.10         │ $113.75 / mo      │
│ 1,000       │ 22,000            │ ₹18,988.20        │ $227.50 / mo      │
│ 5,000       │ 110,000           │ ₹94,941.00        │ $1,137.50 / mo    │
└─────────────┴───────────────────┴───────────────────┴───────────────────┘
*Note: Excludes BSP monthly platform subscription ($25-$49/mo) and 18% GST.
```

#### 3. Administrative Constraints & Operational Friction
1. **Mandatory Meta Business Verification:** Requires formal submission of business registration documents (GST Certificate, Incorporation Deed, utility bill matching address). Personal developers cannot acquire production WhatsApp Cloud API numbers.
2. **Template Pre-Approval System:** Every notification message layout must be pre-submitted and approved by Meta's automated review system. Dynamic tables with variable rows cannot be sent; only rigid parameter substitutions (`{{1}}`, `{{2}}`, etc.) are permitted.
3. **Opt-in & Quality Rating Restrictions:** Users must provide explicit double opt-in. If 2–3% of recipients click "Block" or "Report Spam" in WhatsApp, Meta degrades the phone number quality rating to **"LOW"** and caps outbound broadcasts at 250 numbers/day or permanently bans the number.

---

### 3.2 Telegram Bot API

#### 1. Pricing & Throughput
* **Cost:** **$0.00 (100% Free forever)**. Meta-free, zero per-message charges, zero monthly platform subscriptions.
* **Throughput Limits:**
  * Bot sending to groups/channels: Up to 30 messages/second broadcast throughput.
  * Bot sending direct messages to individual users: Up to 1 message/second per user chat.
* **Subscriber Limits:** Channels support **unlimited subscribers**.

#### 2. Formatting & Rich Media Capabilities
* **Text Formatting:** Full support for **HTML** (`<b>`, `<i>`, `<code>`, `<pre>`, `<a>`) or **MarkdownV2**.
* **Formatted Data Tables:** Can format compact monospace tables using `<pre>` blocks or clean bullet structures grouped by market-cap tier.
* **Inline Keyboards & Dynamic Actions:** Buttons attached beneath messages linking directly to:
  * Screener financial page
  * TradingView live chart
  * BSE corporate filing PDF
  * Web dashboard deep link
* **Native Document Attachments (`sendDocument`):** The bot can automatically generate and attach:
  * Full daily Excel schedule (`.xlsx`)
  * Pre-formatted printable PDF report (`.pdf`)
* **Screenshot Charts (`sendPhoto`):** Can attach auto-generated heatmaps or summary bar charts.

#### 3. Delivery Architectures
* **Option A: Public Telegram Channel (Broadcast Model):**
  * One single API request at 08:00 AM IST delivers the report instantly to thousands of subscribers.
  * Zero server load, zero webhook queuing.
* **Option B: Telegram Forum Topics (Categorized Channels):**
  * A supergroup with enabled Topics (`#large-caps`, `#mid-caps`, `#small-and-micro`, `#sme-emerge`).
  * Subscribers customize notifications per topic.
* **Option C: Direct Bot DM (Personalized Watchlists):**
  * User sends `/watch RELIANCE INFOSYS`.
  * The bot alerts the user only on the mornings when their watched stocks announce results.

---

### 3.3 Transactional Email Delivery (Resend / Amazon SES / SendGrid)

#### 1. Platform Comparison & Deliverability

| Provider | Free Tier | Production Pricing | Best Features | Deliverability / Setup |
| :--- | :--- | :--- | :--- | :--- |
| **Resend** | **3,000 emails/mo** (100/day) | $20/mo (50,000 emails) | Built with React Email; modern REST API; fast webhook tracking. | 10/10; instantly verifies custom domain with DKIM/SPF. |
| **Amazon SES** | 62,000 emails/mo (if hosted on EC2) | **$0.10 per 1,000 emails** ($2.20 for 22,000) | Unbeatable unit economics; industry standard reliability. | 9/10; requires exiting AWS SES sandbox (requires 24-hr ticket approval). |
| **SendGrid** | 100 emails/day | $19.95/mo (50,000 emails) | Legacy email giant; good visual editor. | 8/10; strict account verification; occasional false-positive account suspensions. |
| **Direct SMTP** | N/A (Gmail / Postfix) | Free | No third-party lock-in. | 3/10; Gmail caps at 500 emails/day; high likelihood of landing in spam folder. |

#### 2. Email Formatting Advantage
Email offers the highest visual fidelity:
* Multi-column responsive HTML tables with badges for Market-Cap tier (`Large`, `Mid`, `Small`, `Micro`).
* Embedded links to consensus estimates, historical quarterly beat/miss rates, and corporate filings.
* Printable format suitable for institutional fund managers reading on desktop clients (Outlook, Superhuman, Apple Mail).

---

### 3.4 Notification Channel Recommendation Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             NOTIFICATION DELIVERY DECISION MATRIX                              │
├───────────────────┬──────────────────────┬──────────────────────┬──────────────────────────────┤
│ Attribute         │ WhatsApp Cloud API   │ Telegram Bot API     │ Email (Resend / SES)         │
├───────────────────┼──────────────────────┼──────────────────────┼──────────────────────────────┤
│ Cost for MVP      │ High (~$25 - $50/mo) │ **$0.00 (Free)**     │ **$0.00 (Free)**             │
│ Cost for 1k users │ Prohibitive ($250/mo)│ **$0.00 (Free)**     │ **$2.20/mo (SES)**           │
│ Setup Time        │ 3–7 business days    │ **5 minutes**        │ **30 minutes**               │
│ Risk of Account Ban│ High (User spam flags│ Zero                 │ Very Low (with SPF/DKIM)     │
│ Table Formatting  │ None (Rigid template)│ **Good (`<pre>`)**   │ **Superior (Full HTML/CSS)** │
│ Document Support  │ Yes (PDF)            │ **Yes (PDF + XLSX)** │ Yes (Email Attachments)      │
│ Recommendation    │ ❌ Exclude from MVP  │ ⭐ **Primary MVP**   │ ⭐ **Secondary MVP**         │
│                   │ (Reserved for Paid)  │ (Core Broadcast)     │ (Daily Digest)               │
└───────────────────┴──────────────────────┴──────────────────────┴──────────────────────────────┘
```

**Recommended Phased Rollout:**
* **Phase 1 (MVP):** Launch exclusively with a **Telegram Channel & Bot** (`@EarningsScannerBot`) alongside a daily **Resend Email Digest**. This eliminates 100% of messaging operational costs while delivering rich tables and Excel attachments.
* **Phase 2 (Growth & Monetization):** Introduce WhatsApp delivery strictly as a **"Premium Pro Tier"** (e.g., ₹99 to ₹199/month subscription), where the user subscription easily absorbs the ₹19–₹25 monthly WhatsApp delivery fee.

---

## 4. Infrastructure & Cost Architecture

### 4.1 Compute & Scheduler Analysis

The scanner pipeline consists of two distinct workloads:
1. **Daily Cron Job (07:45 AM & 08:00 AM IST):** Scrapes exchange calendars, checks AMFI classifications, formats reports, and dispatches notifications.
2. **Web API & Dashboard (24/7):** Serves the Next.js / React search dashboard allowing users to filter upcoming earnings by date, sector, and market cap.

#### Option Comparison: Small VPS vs Serverless

| Dimension | Small Cloud VPS (Hetzner / Lightsail) | Serverless (AWS Lambda + EventBridge) | GitHub Actions (Scheduled Workflow) |
| :--- | :--- | :--- | :--- |
| **Scheduling Precision** | **Exact to the second** (Linux `systemd.timer` / `cron`). | **Exact to the minute** (AWS EventBridge). | ❌ **Unreliable (15 to 45 min delay)** during peak load hours. |
| **Execution Timeout** | **Unlimited** (Can run long PDF OCR/scraping tasks). | ❌ Hard **15-minute timeout**. | 6-hour limit (sufficient, but slow cold runners). |
| **Persistence / Cache** | **Local NVMe SSD** (Fast SQLite / DuckDB cache). | Ephemeral (`/tmp` 512MB-10GB, lost on exit). | Ephemeral workspace. |
| **Network IP Reputation**| Static dedicated IP (Easy to whitelist, fewer blocks). | Dynamic shared AWS IPs (Frequently Cloudflare rate-limited). | Shared GitHub runners (High exchange blocking rate). |
| **Monthly Pricing** | **€3.79 / mo (~$4.10)** (Hetzner CX22) or **$5.00** (AWS Lightsail). | Free tier covers executions, but complex IAM & setup. | Free for public repos / 2,000 mins for private. |

**Verdict:** **Small VPS (Hetzner CX22 or AWS Lightsail Mumbai)** is the superior architecture for the backend crawler and dispatch engine. It eliminates cold starts, provides a dedicated IP for web scraping that avoids exchange rate-limits, allows local SQLite storage, and guarantees execution precisely at 08:00 AM IST without the 30-minute jitter of GitHub Actions.

---

### 4.2 Database Layer

For an upcoming earnings scanner, the data volume is predictable:
* Master Equities: ~5,500 records.
* Historical & Upcoming Results: ~20,000 to 50,000 records across 4 quarters.
* Active Subscribers & Watchlists: 1,000 to 50,000 records.
* Total DB storage footprint: **< 100 MB**.

#### Database Options:
1. **MVP Option 1: SQLite with WAL Mode on VPS (Zero Cost, Zero Maintenance)**
   * Single file database on the VPS NVMe SSD.
   * Write-Ahead Logging (`PRAGMA journal_mode=WAL;`) supports concurrent web reads while the morning cron writes.
   * Backed up daily to Cloudflare R2 / AWS S3 via Litestream or simple cron script. Cost: **$0.00 / month**.
2. **MVP Option 2: Neon Serverless PostgreSQL (Free Tier)**
   * Generous free tier: 0.5 GB storage, serverless compute branching.
   * Enables direct database connections from Vercel edge functions. Cost: **$0.00 / month**.
3. **Production: Managed PostgreSQL (Neon Launch Tier or VPS Docker Postgres)**
   * Neon Launch Tier ($19/mo) or Self-Hosted Docker PostgreSQL on a $10/mo Hetzner VPS with automated daily dump to Cloudflare R2 ($0.05/mo).

---

### 4.3 Frontend Hosting

* **Vercel (Hobby Tier):** **$0.00 / month**.
  * Free global CDN, automatic SSL certificates, native Next.js integration.
  * Direct git push deployment workflow.
  * Fast edge caching in Mumbai (`bom1`) datacenter for Indian users.
* **Domain Name (`.in` or `.com`):** ~₹650 to ₹900 / year (**~$0.75 / month**).

---

### 4.4 End-to-End Operating Cost Model

#### 1. MVP Architecture Cost Model ($0 – $4.85 / Month)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MVP COST BREAKDOWN                             │
├────────────────────────┬─────────────────────────────┬──────────────────┤
│ Component              │ Architecture Choice         │ Monthly Cost     │
├────────────────────────┼─────────────────────────────┼──────────────────┤
│ Compute & Scheduler    │ Hetzner Cloud CX22          │ €3.79 (~$4.10)   │
│                        │ (2 vCPU, 4GB RAM, 40GB NVMe)│                  │
│                        │ *(or Local cron / AWS Free) │ *(or $0.00)*     │
│ Database               │ SQLite (WAL) or Neon Free   │ $0.00            │
│ Push Notifications     │ Telegram Bot API            │ $0.00            │
│ Email Notifications    │ Resend Free Tier (3k/mo)    │ $0.00            │
│ Frontend Dashboard     │ Vercel Hobby Tier           │ $0.00            │
│ Domain Name (Optional) │ Custom `.in` domain         │ $0.75            │
├────────────────────────┴─────────────────────────────┴──────────────────┤
│ TOTAL MVP MONTHLY BUDGET:                            │ $4.10 – $4.85/mo │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2. Scaled Production Architecture Cost Model (1,000 to 10,000 Users)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION COST BREAKDOWN                         │
├────────────────────────┬─────────────────────────────┬──────────────────┤
│ Component              │ Architecture Choice         │ Monthly Cost     │
├────────────────────────┼─────────────────────────────┼──────────────────┤
│ Production Compute     │ Hetzner CX32 / Lightsail 4GB│ $10.00 – $14.00  │
│ Managed Database       │ Neon Postgres Launch Tier   │ $19.00           │
│                        │ (or VPS Docker Postgres)    │ *(or $0.00)*     │
│ Core Broadcasts        │ Telegram Unlimited Channel  │ $0.00            │
│ Bulk Email Dispatch    │ Amazon SES (50,000 emails)  │ $5.00            │
│ Cloud Object Storage   │ Cloudflare R2 (PDFs/Backups)│ $0.50            │
│ Frontend Edge Hosting  │ Vercel Pro (or Free Tier)   │ $0.00 – $20.00   │
│ Domain & Monitoring    │ Domain + BetterUptime Free  │ $0.75            │
├────────────────────────┴─────────────────────────────┴──────────────────┤
│ TOTAL PRODUCTION MONTHLY BUDGET:                     │ $16.25 – $35.00  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Artifact Reference & Sample Files

All sample scripts, payloads, and raw source datasets generated during this research have been stored in the project workspace:

1. **AMFI Master Classification Sample:**
   * Path: [`research/infra/samples/amfi_market_cap_30Jun2026.xlsx`](file:///c:/DEV/FFS/ResultBased%20Strategy/research/infra/samples/amfi_market_cap_30Jun2026.xlsx)
   * Size: 582,050 bytes | Total rows: 5,428.
2. **Automated AMFI Downloader & Classifier Script:**
   * Path: [`research/infra/amfi_classifier.py`](file:///c:/DEV/FFS/ResultBased%20Strategy/research/infra/amfi_classifier.py)
   * Features: Automatic latest file URL discovery, unverified SSL bypass, Pandas normalizer, multi-tier ranking.
3. **Telegram Notification Sample Payload:**
   * Path: [`research/infra/samples/telegram_sample_message.html`](file:///c:/DEV/FFS/ResultBased%20Strategy/research/infra/samples/telegram_sample_message.html)
   * Ready for direct transmission via `sendMessage` using `parse_mode="HTML"`.
4. **WhatsApp Template Cloud API Payload:**
   * Path: [`research/infra/samples/whatsapp_template_payload.json`](file:///c:/DEV/FFS/ResultBased%20Strategy/research/infra/samples/whatsapp_template_payload.json)
   * Standard Meta Graph API JSON payload adhering to Meta template standards.
5. **Responsive Email HTML Digest:**
   * Path: [`research/infra/samples/email_sample_template.html`](file:///c:/DEV/FFS/ResultBased%20Strategy/research/infra/samples/email_sample_template.html)
   * Mobile-responsive table with market-cap badges and deep links.

---

## 6. Actionable Implementation Checklist

- [x] Verify live AMFI download link and automate URL discovery against Next.js frontend.
- [x] Document SEBI market-cap categorization rules (Large Cap 1-100, Mid Cap 101-250, Small Cap 251+).
- [x] Establish taxonomy for Micro-cap (501-1,000), Nano-cap (1,001+), and SME platforms (NSE Emerge / BSE SME).
- [x] Obtain Meta WhatsApp 2025/2026 India rate card (₹0.8631/marketing message) and calculate unit economics.
- [x] Generate working samples for Telegram HTML, WhatsApp JSON, and Email HTML.
- [x] Formulate zero-jitter VPS scheduler topology and complete monthly cost model ($4.10 MVP vs $25 Production).
- [ ] **Next Step (Subagent A/B Integration):** Integrate `amfi_classifier.py` into the primary database seeding pipeline to populate the `equities` table.
