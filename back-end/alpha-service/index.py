from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
import json
import os

ES_HOST = os.getenv("ELASTICSEARCH_HOST", "http://elasticsearch:9200")
es = Elasticsearch(ES_HOST, verify_certs=False, request_timeout=30)

with open("stocks.json") as f:
    stocks = json.load(f)

actions = [
    {
        "_index": "stocks",
        "_id": stock["symbol"],
        "_source": {
            "symbol": stock["symbol"],
            "name": stock["name"],
            "suggest": {"input": [stock["symbol"], stock["name"]]}
        }
    } for stock in stocks
]

bulk(es, actions)
es.indices.refresh(index="stocks")
