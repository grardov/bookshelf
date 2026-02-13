from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import collection, discogs, users

app = FastAPI(title="Bookshelf API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(discogs.router, prefix="/api/discogs", tags=["discogs"])
app.include_router(collection.router, prefix="/api/collection", tags=["collection"])


@app.get("/health")
async def healthcheck():
    return {"status": "ok"}
