import yfinance as yf
import pandas as pd
from datetime import datetime

tickers = {
    "ITC": "ITC.NS",
    "MARICO": "MARICO.NS",
    "NATIONALUM": "NATIONALUM.NS",
    "UPL": "UPL.NS",
    "PETRONET": "PETRONET.NS",
    "ESCORTS": "ESCORTS.NS",
    "PGHL": "PGHL.NS",
    "CINELINE": "CINELINE.NS",
    "AELEA": "544213.BO"
}

results = {}

for sym, yf_sym in tickers.items():
    print(f"--- Fetching {sym} ({yf_sym}) ---")
    try:
        t = yf.Ticker(yf_sym)
        df = t.history(start="2026-10-25", end="2026-11-05")
        if df.empty:
            print(f"No data for {yf_sym}")
            # Try alternate symbol if needed
            if sym == "AELEA":
                df = yf.Ticker("ACLD.BO").history(start="2026-10-25", end="2026-11-05")
        
        if not df.empty:
            print(f"Retrieved {len(df)} days of data for {sym}")
            for idx, row in df.iterrows():
                dt_str = idx.strftime("%Y-%m-%d")
                print(f"  {dt_str}: Open={row['Open']:.2f}, High={row['High']:.2f}, Low={row['Low']:.2f}, Close={row['Close']:.2f}, Vol={int(row['Volume'])}")
        else:
            print(f"Still no data for {sym}")
    except Exception as e:
        print(f"Error for {sym}: {e}")
