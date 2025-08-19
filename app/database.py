import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from os import getenv
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.get_default_database("copytrading")  # Add the database name here

users = db.users
experts = db.experts
funding_requests = db.funding_requests
withdrawal_requests = db.withdrawal_requests
user_alerts = db.user_alerts
copying_plans = db.copying_plans