from fastapi import FastAPI

app = FastAPI(title="Bookshelf API")


@app.get("/health")
async def healthcheck():
    return {"status": "ok"}
