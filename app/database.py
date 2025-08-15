# File: database.py
import motor.motor_asyncio
from os import getenv
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = getenv("MONGO_URL")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.get_default_database()

users = db.users
experts = db.experts
funding_requests = db.funding_requests
withdrawal_requests = db.withdrawal_requests
user_alerts = db.user_alerts
copying_plans = db.copying_plans