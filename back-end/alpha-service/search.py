from fastapi import APIRouter, Query
from elasticsearch import Elasticsearch
import os
import logging

router = APIRouter()
log = logging.getLogger("alpha-search")
logging.basicConfig(level=logging.INFO)

ES_HOST = os.getenv("ELASTICSEARCH_HOST", "http://elasticsearch:9200")
es = Elasticsearch(ES_HOST, verify_certs=False, request_timeout=5)

@router.get("/search")
def search_stocks(query: str = Query(..., min_length=1)):
    try:
        body = {
            "size": 10,
            "query": {
                "bool": {
                    "should": [
                        # Fuzzy match on company name
                        {"match": {"name": {"query": query, "fuzziness": "AUTO"}}},
                        # Exact or prefix match on symbol
                        {"prefix": {"symbol": query.upper()}},
                        # Use completion suggest for autocomplete (optional)
                        {
                            "match_phrase_prefix": {
                                "name": {"query": query}
                            }
                        }
                    ]
                }
            }
        }

        resp = es.search(index="stocks", body=body)
        hits = resp["hits"]["hits"]
        results = [
            {"symbol": h["_source"].get("symbol"), "name": h["_source"].get("name")}
            for h in hits
        ]
        return results

    except Exception as e:
        log.error(f"Search error: {e}")
        return []
