# File: routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import random
import string
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from os import getenv
import jwt
from passlib.context import CryptContext
from ..database import users
from ..models import Register, Login, Verify

router = APIRouter()

JWT_SECRET = getenv("JWT_SECRET")
SMTP_HOST = getenv("SMTP_HOST")
SMTP_PORT = int(getenv("SMTP_PORT"))
SMTP_USER = getenv("SMTP_USER")
SMTP_PASS = getenv("SMTP_PASS")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_token(data: dict):
    return jwt.encode(data, JWT_SECRET, algorithm="HS256")

def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_token(credentials.credentials)
        email = payload["email"]
        user = await users.find_one({"email": email})
        if not user or not user["verified"] or user["suspended"]:
            raise ValueError
        return user
    except:
        raise HTTPException(401, "Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "admin":
            raise ValueError
        email = payload["email"]
        user = await users.find_one({"email": email})
        if not user or not user["verified"] or user["suspended"]:
            raise ValueError
        return user
    except:
        raise HTTPException(401, "Invalid token")

@router.post("/register")
async def register(reg: Register):
    existing_email = await users.find_one({"email": reg.email})
    if existing_email:
        raise HTTPException(400, "Email exists")
    existing_username = await users.find_one({"username": reg.username})
    if existing_username:
        raise HTTPException(400, "Username exists")
    token = ''.join(random.choices(string.digits, k=6))
    expire = datetime.utcnow() + timedelta(minutes=10)
    user_doc = {
        "email": reg.email,
        "username": reg.username,
        "password_hash": pwd_context.hash(reg.password),
        "verified": False,
        "verification_token": token,
        "verification_expire": expire,
        "role": "user",
        "balance": 0.0,
        "copied_traders": [],
        "active_plans": [],
        "suspended": False,
        "referrer_username": reg.referrer_username,
        "registered_at": datetime.utcnow()
    }
    await users.insert_one(user_doc)
    try:
        msg = MIMEText(f"Your verification token is {token}")
        msg["Subject"] = "Verification Token"
        msg["From"] = SMTP_USER
        msg["To"] = reg.email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"Email send failed: {e}")
    return {"message": "Token sent"}

@router.post("/verify")
async def verify(ver: Verify):
    user = await users.find_one({"email": ver.email})
    if not user or user["verification_token"] != ver.token or user["verification_expire"] < datetime.utcnow():
        raise HTTPException(400, "Invalid token")
    await users.update_one({"email": ver.email}, {"$set": {"verified": True, "verification_token": None, "verification_expire": None}})
    return {"message": "Verified"}

@router.post("/login")
async def login(log: Login):
    print(f"Attempting login for email: {log.email}")
    user = await users.find_one({"email": log.email})
    print(f"User found: {user is not None}")
    if user:
        print(f"User verified: {user.get('verified', 'missing')}")
        print(f"Password match: {pwd_context.verify(log.password, user['password_hash'])}")
    if not user or not pwd_context.verify(log.password, user["password_hash"]) or not user["verified"]:
        raise HTTPException(400, "Invalid credentials")
    jwt_token = create_token({"email": log.email, "role": user["role"]})
    return {"token": jwt_token}

@router.post("/admin/login")
async def admin_login(log: Login):
    user = await users.find_one({"email": log.email})
    if not user or not pwd_context.verify(log.password, user["password_hash"]) or not user["verified"] or user["role"] != "admin":
        raise HTTPException(400, "Invalid credentials")
    jwt_token = create_token({"email": log.email, "role": user["role"]})
    return {"token": jwt_token}