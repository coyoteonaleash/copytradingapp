# File: models.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid

class Plan(BaseModel):
    plan_id: str
    amount: float
    activated_at: datetime

class CopyingPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    roi_daily: float
    min_amount: float
    max_amount: float
    duration_days: int

class ExpertTrader(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    photo_url: Optional[str] = None

class FundingRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    amount: float
    status: str = "pending"
    payment_info: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WithdrawalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    amount: float
    account_details: dict
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SendAlert(BaseModel):
    email: str
    message: str

class Register(BaseModel):
    username: str
    email: str
    password: str
    referrer_username: Optional[str] = None

class Login(BaseModel):
    email: str
    password: str

class Verify(BaseModel):
    email: str
    token: str

# --- NEW MODELS FOR REQUEST BODIES ---

class CopyTraderRequest(BaseModel):
    trader_id: str

class FundingRequestBody(BaseModel):
    amount: float

class ConfirmPaymentRequest(BaseModel):
    request_id: str

class WithdrawalRequestBody(BaseModel):
    amount: float
    account_details: Dict

class SubscribePlanRequest(BaseModel):
    plan_id: str
    amount: float

class DeleteUserRequest(BaseModel):
    email: str

class SuspendUserRequest(BaseModel):
    email: str
    suspend: bool

class RemoveExpertRequest(BaseModel):
    id: str

class ApproveFundingRequest(BaseModel):
    request_id: str
    payment_info: Dict

class DenyRequest(BaseModel):
    request_id: str
    
class RemovePlanRequest(BaseModel):
    id: str