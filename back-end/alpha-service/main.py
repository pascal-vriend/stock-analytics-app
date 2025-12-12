from fastapi import FastAPI
from stocks import router as stocks_router
from search import router as search_router

app = FastAPI(title="Alpha Vantage Service")
app.include_router(stocks_router)
app.include_router(search_router)
