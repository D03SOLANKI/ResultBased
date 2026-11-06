# Quick Guide: Running the Results Scanner on your MacBook via Docker

This guide explains how to transfer this project from your Windows PC to your **MacBook (Apple Silicon M1/M2/M3/M4 or Intel)** and run it seamlessly inside Docker.

---

## Step 1: Transfer the Folder to your MacBook

Choose whichever method is easiest for you:

### Method A: Via Git / GitHub (Recommended)
On your Windows PC (run in PowerShell / Terminal):
```bash
git init
git add .
git commit -m "All India Results Scanner Docker Release"
git branch -M main
git remote add origin https://github.com/<your-username>/results-scanner.git
git push -u origin main
```
Then on your MacBook Terminal:
```bash
git clone https://github.com/<your-username>/results-scanner.git
cd results-scanner
```

### Method B: Via USB Flash Drive or Zip
1. Copy the entire folder `ResultBased Strategy` to your USB drive or compress it as a `.zip`.
2. Move it to your MacBook and place it in your user directory (e.g., `~/Documents/results-scanner`).

---

## Step 2: Launch with 1 Command on your MacBook

1. Make sure **Docker Desktop** is open on your Mac (Download free from [docker.com](https://www.docker.com/products/docker-desktop/) if not already installed).
2. Open **Terminal** on your Mac, navigate into the project directory, and run:

```bash
chmod +x start_mac.sh
./start_mac.sh
```

*(Alternatively, you can just type standard docker compose command)*:
```bash
docker compose up -d --build
```

---

## Step 3: Access Dashboard & Features

* **Interactive Web Dashboard**: [http://localhost:8000](http://localhost:8000)
* **REST API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Daily 8:00 AM IST Report**: [http://localhost:8000/api/report/daily](http://localhost:8000/api/report/daily)
* **Live Surveillance Feed**: [http://localhost:8000/api/performance/surveillance/status](http://localhost:8000/api/performance/surveillance/status)

---

## Useful Mac Commands

* **View live background logs (Exchange scans every 30s)**:
  ```bash
  docker logs -f results_scanner_app
  ```
* **Stop the container**:
  ```bash
  ./stop_mac.sh
  # or: docker compose down
  ```
* **Restart the container**:
  ```bash
  docker compose restart
  ```
* **Access from your iPhone / iPad on the same Wi-Fi**:
  1. Find your Mac's local IP address:
     ```bash
     ipconfig getifaddr en0
     ```
     *(e.g., `192.168.1.45`)*
  2. Open Safari on your iPhone/iPad and visit:
     `http://192.168.1.45:8000`
