# 24/7 Cloud Production Deployment Guide
## All India Listed Companies — Upcoming Financial Results Scanner

This guide explains how to deploy the scanner so it runs **24/7 on a cloud server**, completely independent of your local PC. Once deployed:
1. The **Real-Time Surveillance Engine** monitors NSE & BSE feeds continuously 24/7.
2. The **8:00 AM IST Daily Report** generates and broadcasts automatically every morning.
3. The **Web Dashboard** is accessible from your smartphone, tablet, or work laptop via a secure public HTTPS URL (e.g. `https://scanner.yourdomain.com` or `https://results-scanner.onrender.com`).

---

## Architecture Summary
The system is built as a **Single Unified Container Service**:
* **Backend**: Python 3.11 + FastAPI + SQLite (WAL Mode) + Background Surveillance Thread.
* **Frontend**: React + Vite + Tailwind CSS (compiled into `frontend/dist` and served directly by FastAPI).
* **Port**: `8000`
* **Data Persistence**: `/app/backend/data/scanner.db`

---

## Option 1: Managed Cloud Deployment (Render / Railway) — *Easiest & Quickest*

### A. Deploying on Render (Recommended)
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for 24/7 deployment"
   git remote add origin https://github.com/your-username/results-scanner.git
   git push -u origin main
   ```
2. **Create a Web Service on Render**:
   - Go to [render.com](https://render.com) and create an account.
   - Click **New +** → **Web Service** → Connect your GitHub repository.
   - Environment: **Docker** (Render will automatically detect `Dockerfile`).
   - Region: **Singapore** or **Frankfurt** (or closest available).
   - Plan: **Starter ($7/mo)** (provides persistent disk).
3. **Add Persistent Disk**:
   - In your Render service settings, go to **Disks** → **Add Disk**.
   - Name: `scanner-data`
   - Mount Path: `/app/backend/data`
   - Size: `1 GB` (sufficient for 10+ years of corporate filings).
4. **Environment Variables**:
   - `TZ`: `Asia/Kolkata`
   - `PORT`: `8000`
5. Click **Deploy**. Your dashboard will be live at `https://<your-app-name>.onrender.com` 24/7!

---

## Option 2: Linux Cloud VPS (DigitalOcean / AWS EC2 Mumbai / Hetzner) — *Best Performance & Lowest Latency*

Deploying on a Linux VPS in **Mumbai (`ap-south-1`)** gives the lowest network latency to official NSE/BSE exchange endpoints.

### Step 1: Create a Server
- Provider: **DigitalOcean** ($4-$6/mo Droplet) or **AWS EC2** (`t4g.small` / `t3.micro` in `ap-south-1` Mumbai).
- OS: **Ubuntu 24.04 LTS** (or 22.04 LTS).

### Step 2: Connect via SSH
```bash
ssh ubuntu@your-server-ip
```

### Step 3: Install Docker & Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Step 4: Clone the Repository & Start
```bash
# Clone the repository
git clone https://github.com/your-username/results-scanner.git /home/ubuntu/results-scanner
cd /home/ubuntu/results-scanner

# Start the application in the background (detached daemon mode)
sudo docker compose up -d --build
```

### Step 5: Verify Container Status & Logs
```bash
# Check if container is running
sudo docker ps

# View live real-time surveillance logs
sudo docker logs -f results_scanner_app
```

Your system is now live 24/7 at `http://your-server-ip:8000`!

---

## Option 3: Setting Up a Custom Domain with Free SSL (HTTPS)

To access your scanner securely via `https://scanner.yourdomain.com`:

1. **Install Nginx & Certbot**:
   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```

2. **Copy the Nginx Configuration**:
   ```bash
   sudo cp deploy/nginx/results-scanner.conf /etc/nginx/sites-available/results-scanner
   # Edit with your domain name
   sudo nano /etc/nginx/sites-available/results-scanner
   # Enable site
   sudo ln -s /etc/nginx/sites-available/results-scanner /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **Issue Free SSL Certificate**:
   ```bash
   sudo certbot --nginx -d scanner.yourdomain.com
   ```

Certbot will automatically install SSL and set up automatic 90-day renewal.

---

## Operational Health & Surveillance Monitoring

Once deployed on your server:
* **Web Dashboard**: `https://your-domain.com/`
* **API Documentation**: `https://your-domain.com/docs`
* **Daily 8:00 AM Report Endpoint**: `https://your-domain.com/api/report/daily`
* **Surveillance Health Check**: `https://your-domain.com/api/performance/surveillance/status`

The container will automatically restart if the server reboots (`restart: always`), ensuring zero manual intervention.
