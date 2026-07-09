import time
import math
import yfinance as yf
from fastapi import APIRouter, HTTPException

router = APIRouter()

_cache = {}
CACHE_DURATION = 60  # seconds


def get_cached(ticker: str):
    data = _cache.get(ticker)
    if data and time.time() - data['timestamp'] < CACHE_DURATION:
        return data['value']
    return None


def set_cache(ticker: str, value):
    _cache[ticker] = {'value': value, 'timestamp': time.time()}


def fetch_quote(ticker: str):
    cached = get_cached(ticker)
    if cached:
        return cached

    try:
        fast_info = yf.Ticker(ticker).fast_info
        current = fast_info.last_price
        previous = fast_info.previous_close
    except Exception:
        # yfinance raises (e.g. KeyError) for unknown/delisted symbols
        raise HTTPException(status_code=404, detail="Ticker not found")

    if current is None or previous is None or math.isnan(current) or math.isnan(previous):
        raise HTTPException(status_code=404, detail="Ticker not found")

    change = current - previous
    percent = (change / previous * 100) if previous else 0.0

    result = {
        "symbol": ticker.upper(),
        "current": round(float(current), 2),
        "change": round(float(change), 2),
        "percent": round(float(percent), 2),
    }
    set_cache(ticker, result)
    return result


@router.get("/stocks/{ticker}")
def get_stock(ticker: str):
    return fetch_quote(ticker)
