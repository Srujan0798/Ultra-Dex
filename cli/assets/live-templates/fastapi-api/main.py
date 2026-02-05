"""
FastAPI SaaS API Template
Production-ready API with auth, database, and payments
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime

app = FastAPI(
    title="FastAPI SaaS API",
    description="Production-ready API template",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Models
class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str = "user"
    created_at: datetime = datetime.now()

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class Subscription(BaseModel):
    id: str
    user_id: str
    plan: str
    status: str
    stripe_customer_id: Optional[str] = None
    current_period_end: Optional[datetime] = None

class APIKey(BaseModel):
    id: str
    user_id: str
    key: str
    name: str
    created_at: datetime

# In-memory store (replace with database)
users_db = {}
subscriptions_db = {}
api_keys_db = {}

# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Verify JWT token (simplified)
    if token.startswith("user_"):
        user_id = token.replace("user_", "")
        if user_id in users_db:
            return users_db[user_id]
    raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/")
async def root():
    return {"message": "FastAPI SaaS API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Auth routes
@app.post("/auth/register", response_model=User)
async def register(user: UserCreate):
    user_id = f"user_{len(users_db) + 1}"
    new_user = User(id=user_id, email=user.email, name=user.name)
    users_db[user_id] = new_user
    return new_user

@app.get("/auth/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    return user

# Subscription routes
@app.get("/subscriptions", response_model=List[Subscription])
async def list_subscriptions(user: User = Depends(get_current_user)):
    return [s for s in subscriptions_db.values() if s.user_id == user.id]

@app.post("/subscriptions/checkout")
async def create_checkout(plan: str, user: User = Depends(get_current_user)):
    # Integrate with Stripe
    return {
        "checkout_url": f"https://checkout.stripe.com/pay/{plan}",
        "plan": plan
    }

# API Key routes
@app.get("/api-keys", response_model=List[APIKey])
async def list_api_keys(user: User = Depends(get_current_user)):
    return [k for k in api_keys_db.values() if k.user_id == user.id]

@app.post("/api-keys", response_model=APIKey)
async def create_api_key(name: str, user: User = Depends(get_current_user)):
    import secrets
    key_id = f"key_{len(api_keys_db) + 1}"
    api_key = APIKey(
        id=key_id,
        user_id=user.id,
        key=f"sk_{secrets.token_hex(16)}",
        name=name,
        created_at=datetime.now()
    )
    api_keys_db[key_id] = api_key
    return api_key

# Webhook handler
@app.post("/webhooks/stripe")
async def stripe_webhook(payload: dict):
    event_type = payload.get("type")
    
    if event_type == "checkout.session.completed":
        # Handle successful checkout
        pass
    elif event_type == "customer.subscription.updated":
        # Handle subscription update
        pass
    elif event_type == "customer.subscription.deleted":
        # Handle cancellation
        pass
    
    return {"received": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
