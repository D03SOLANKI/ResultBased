"""
nse_client.py - Production-ready NSE Client for Upcoming Financial Results Scanner.
Uses curl_cffi for browser TLS impersonation to bypass Akamai bot detection.
"""

import time
import csv
import io
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from curl_cffi import requests as cffi_requests


class NSEClient:
    """Client for querying NSE corporate announcements, board meetings, and results."""

    BASE_URL = "https://www.nseindia.com"
    ARCHIVES_URL = "https://nsearchives.nseindia.com"

    def __init__(self, session_ttl_minutes: int = 120):
        self.session_ttl_minutes = session_ttl_minutes
        self.last_session_init: Optional[datetime] = None
        self.session: Optional[cffi_requests.Session] = None
        self._init_session()

    def _init_session(self) -> None:
        """Initialize session with Chrome 120 TLS fingerprint and fetch Akamai cookies."""
        self.session = cffi_requests.Session(impersonate="chrome120")
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        # Visit homepage to trigger Akamai cookie generation
        resp = self.session.get(f"{self.BASE_URL}", headers=headers, timeout=15)
        if resp.status_code != 200:
            raise ConnectionError(f"Failed to initialize NSE session: HTTP {resp.status_code}")
        self.last_session_init = datetime.now()

    def _ensure_session(self) -> None:
        """Refresh session if TTL expired."""
        if (
            not self.last_session_init
            or (datetime.now() - self.last_session_init).total_seconds() > self.session_ttl_minutes * 60
        ):
            self._init_session()

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None, retries: int = 3) -> Any:
        """Internal GET helper with session maintenance and error handling."""
        self._ensure_session()
        url = f"{self.BASE_URL}{endpoint}" if endpoint.startswith("/") else endpoint
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-board-meetings",
        }

        for attempt in range(retries):
            try:
                resp = self.session.get(url, params=params, headers=headers, timeout=20)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code in (401, 403):
                    # Akamai challenge or expired cookie; re-initialize and retry
                    self._init_session()
                    time.sleep(1)
                else:
                    time.sleep(1)
            except Exception as e:
                if attempt == retries - 1:
                    raise e
                time.sleep(1.5)
        raise RuntimeError(f"Failed to fetch {url} after {retries} attempts.")

    # --- 1. Master Equity Lists ---

    def get_mainboard_equities(self) -> List[Dict[str, str]]:
        """Fetch 2,635 Mainboard listed equities from EQUITY_L.csv."""
        url = f"{self.ARCHIVES_URL}/content/equities/EQUITY_L.csv"
        resp = self.session.get(url, timeout=15)
        reader = csv.DictReader(io.StringIO(resp.text))
        cleaned = []
        for row in reader:
            cleaned.append({k.strip(): v.strip() for k, v in row.items() if k})
        return cleaned

    def get_sme_equities(self) -> List[Dict[str, str]]:
        """Fetch 582 SME Emerge listed equities from SME_EQUITY_L.csv."""
        url = f"{self.ARCHIVES_URL}/emerge/corporates/content/SME_EQUITY_L.csv"
        resp = self.session.get(url, timeout=15)
        reader = csv.DictReader(io.StringIO(resp.text))
        cleaned = []
        for row in reader:
            cleaned.append({k.strip(): v.strip() for k, v in row.items() if k})
        return cleaned

    # --- 2. Forthcoming Event Calendar ---

    def get_event_calendar(self, index: str = "equities") -> List[Dict[str, Any]]:
        """Fetch forthcoming corporate events calendar (800+ scheduled meetings).
        
        Args:
            index: 'equities' or 'sme'
        """
        params = {"index": index} if index != "equities" else None
        return self._get("/api/event-calendar", params=params)

    def get_upcoming_results_calendar(self) -> List[Dict[str, Any]]:
        """Fetch upcoming calendar filtered specifically for Financial Results announcements."""
        events = self.get_event_calendar(index="equities")
        return [
            ev for ev in events
            if "financial results" in ev.get("purpose", "").lower()
        ]

    # --- 3. Board Meetings Intimations ---

    def get_board_meetings(
        self,
        index: str = "equities",
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        symbol: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query board meetings intimations with optional date window or symbol filter.
        
        Args:
            index: 'equities' or 'sme'
            from_date: 'DD-MM-YYYY'
            to_date: 'DD-MM-YYYY'
            symbol: Ticker symbol (e.g. 'RELIANCE')
        """
        params: Dict[str, Any] = {"index": index}
        if from_date and to_date:
            params["from_date"] = from_date
            params["to_date"] = to_date
        if symbol:
            params["symbol"] = symbol
        return self._get("/api/corporate-board-meetings", params=params)

    # --- 4. Corporate Announcements ---

    def get_corporate_announcements(
        self,
        index: str = "equities",
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        symbol: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query corporate announcements stream."""
        params: Dict[str, Any] = {"index": index}
        if from_date and to_date:
            params["from_date"] = from_date
            params["to_date"] = to_date
        if symbol:
            params["symbol"] = symbol
        return self._get("/api/corporate-announcements", params=params)

    # --- 5. Historical Financial Results Filings ---

    def get_financial_results_filings(
        self,
        index: str = "equities",
        period: str = "Quarterly",
        symbol: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query submitted financial results filings."""
        params: Dict[str, Any] = {"index": index, "period": period}
        if symbol:
            params["symbol"] = symbol
        return self._get("/api/corporates-financial-results", params=params)


if __name__ == "__main__":
    client = NSEClient()
    print("Testing client:")
    mb = client.get_mainboard_equities()
    print(f"Mainboard equities: {len(mb)} symbols loaded.")
    sme = client.get_sme_equities()
    print(f"SME equities: {len(sme)} symbols loaded.")
    cal = client.get_upcoming_results_calendar()
    print(f"Upcoming financial results events: {len(cal)} events found.")
    if cal:
        print(f"First event: {cal[0]['symbol']} on {cal[0]['date']} - {cal[0]['purpose']}")
