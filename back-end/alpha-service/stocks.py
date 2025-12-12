import os
import time
import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()
ALPHA_KEY = os.environ.get("ALPHA_API_KEY")
if not ALPHA_KEY:
    raise Exception("Please set ALPHA_API_KEY environment variable")

_cache = {}
CACHE_DURATION = 60000000


def get_cached(ticker: str):
    data = _cache.get(ticker)
    if data and time.time() - data['timestamp'] < CACHE_DURATION:
        return data['value']
    return None


def set_cache(ticker: str, value):
    _cache[ticker] = {'value': value, 'timestamp': time.time()}


def fetch_alpha_vantage(ticker: str):
    cached = get_cached(ticker)
    if cached:
        return cached

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": ticker,
        "apikey": ALPHA_KEY
    }
    r = requests.get(url, params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Alpha Vantage API error")

    data = r.json().get("Global Quote")
    if not data:
        raise HTTPException(status_code=404, detail="Ticker not found or API limit reached")

    result = {
        "symbol": ticker.upper(),
        "current": float(data["05. price"]),
        "change": float(data["09. change"]),
        "percent": float(data["10. change percent"].rstrip("%"))
    }
    set_cache(ticker, result)
    return result


@router.get("/stocks/{ticker}")
def get_stock(ticker: str):
    return fetch_alpha_vantage(ticker)
