from fastapi import FastAPI
from backend.app.api.routes import router as api_router
from dotenv import load_dotenv

# Run the following command to start the API on local host:
# uvicorn backend.app.main:app --reload
# Navigate to http://127.0.0.1:8000/docs to see the API documentation

load_dotenv()  # This will load variables from a .env file into the environment

app = FastAPI(title="Solana Trading Bot API")

app.include_router(api_router, prefix="/api")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Solana Trading Bot API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 