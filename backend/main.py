from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import database
import math

# Initialize database
database.init_db()

app = FastAPI(title="Facelogger API", description="Facial recognition and password authentication backend")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000", 
        "http://localhost:3001", "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Starlette Session middleware for secure signed cookie session tracking
app.add_middleware(
    SessionMiddleware,
    secret_key="facial-sec-secret-key-2026-python-security",
    session_cookie="connect.sid",
    max_age=24 * 60 * 60,  # 24 hours in seconds
    same_site="lax",
    https_only=False
)

# Pydantic Schemas
class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field("", max_length=20)
    company: str = Field("", max_length=100)
    role: str = Field("", max_length=100)
    password: str = Field(..., min_length=4, max_length=50)
    descriptor: Optional[List[float]] = Field(None, min_items=128, max_items=128)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=50)
    descriptor: List[float] = Field(..., min_items=128, max_items=128)

class PasswordLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=50)
    password: str = Field(..., min_length=4, max_length=50)

class VerifyEmailRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=50)

# Helper: Compute Euclidean distance between two 128D lists
def euclidean_distance(vector1: List[float], vector2: List[float]) -> float:
    if len(vector1) != len(vector2):
        return float('inf')
    return math.sqrt(sum((v1 - v2) ** 2 for v1, v2 in zip(vector1, vector2)))

@app.post("/api/verify-email")
async def verify_email(body: VerifyEmailRequest):
    email = body.email.strip().lower()
    user = database.get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not registered."
        )
    return {"registered": True, "email": email}

@app.post("/api/register")
async def register(body: RegisterRequest):
    email = body.email.strip().lower()
    name = body.name.strip()
    phone = body.phone.strip()
    company = body.company.strip()
    role = body.role.strip()
    password = body.password
    descriptor = body.descriptor

    # 1. Check if email is already taken
    existing_user = database.get_user(email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )

    # 2. Check for duplicate face registrations if descriptor is provided
    if descriptor:
        users = database.get_all_users()
        DUPLICATE_THRESHOLD = 0.55  # If distance < 0.55, it's the same person
        
        for user in users:
            if user["descriptor"]:
                distance = euclidean_distance(descriptor, user["descriptor"])
                print(f"[Register Duplicate Check] Distance to {user['email']}: {distance:.4f}")
                if distance < DUPLICATE_THRESHOLD:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Registration blocked. This face is already registered under '{user['email']}'."
                    )

    # 3. Store user in database
    success = database.register_user(
        email=email,
        name=name,
        phone=phone,
        company=company,
        role=role,
        password=password,
        descriptor_list=descriptor
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save user registration data."
        )

    print(f"[Register Success] Registered user: {email}")
    return {"success": True, "email": email}

@app.post("/api/login")
async def login(request: Request, body: LoginRequest):
    email = body.email.strip().lower()
    descriptor = body.descriptor

    # 1. Find user by email
    user = database.get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered."
        )

    if not user["descriptor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No facial profile registered for this account. Please sign in with your password."
        )

    # 2. Compare face descriptor
    distance = euclidean_distance(descriptor, user["descriptor"])
    MATCH_THRESHOLD = 0.55
    
    print(f"[Login Attempt] Email: {email}, distance: {distance:.4f} (Threshold: {MATCH_THRESHOLD})")

    if distance < MATCH_THRESHOLD:
        # Establish session
        request.session["email"] = user["email"]
        print(f"[Login Success] Authenticated email: {user['email']}")
        return {
            "success": True, 
            "email": user["email"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Face not recognized. Please align your face and try again."
        )

@app.post("/api/login-password")
async def login_password(request: Request, body: PasswordLoginRequest):
    email = body.email.strip().lower()
    password = body.password

    user = database.get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered."
        )

    # Hash and check
    pwd_hash = database.hash_password(password)
    if pwd_hash == user["password_hash"]:
        request.session["email"] = user["email"]
        print(f"[Password Login Success] Authenticated: {user['email']}")
        return {
            "success": True,
            "email": user["email"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

@app.get("/api/me")
async def me(request: Request):
    email = request.session.get("email")
    if email:
        user = database.get_user(email)
        if user:
            return {
                "authenticated": True,
                "email": user["email"],
                "name": user["name"],
                "phone": user["phone"],
                "company": user["company"],
                "role": user["role"]
            }
    return {"authenticated": False}

@app.post("/api/logout")
async def logout(request: Request):
    email = request.session.get("email")
    request.session.clear()
    if email:
        print(f"[Logout] User logged out: {email}")
    return {"success": True}
