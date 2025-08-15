# File: routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from ..models import (
    ExpertTrader, CopyingPlan, SendAlert, DeleteUserRequest, SuspendUserRequest,
    RemoveExpertRequest, ApproveFundingRequest, DenyRequest, RemovePlanRequest
)
from ..database import users, experts, funding_requests, withdrawal_requests, user_alerts, copying_plans
from .auth import get_current_admin
from datetime import datetime
import uuid
from ..connection_manager import manager
import json
from bson import ObjectId

router = APIRouter()

@router.get("/users")
async def get_users(admin: Dict = Depends(get_current_admin)):
    us = await users.find().to_list(100)
    for u in us:
        u.pop("password_hash", None)
        u.pop("verification_token", None)
        u.pop("verification_expire", None)
        u["_id"] = str(u["_id"])
    return us

@router.post("/delete_user")
async def delete_user(req: DeleteUserRequest, admin: Dict = Depends(get_current_admin)):
    await users.delete_one({"email": req.email})
    return {"message": "Deleted"}

@router.post("/suspend_user")
async def suspend_user(req: SuspendUserRequest, admin: Dict = Depends(get_current_admin)):
    await users.update_one({"email": req.email}, {"$set": {"suspended": req.suspend}})
    return {"message": "Updated"}

@router.post("/add_expert")
async def add_expert(trader: ExpertTrader, admin: Dict = Depends(get_current_admin)):
    await experts.insert_one(trader.model_dump())
    return {"id": trader.id}

@router.post("/remove_expert")
async def remove_expert(req: RemoveExpertRequest, admin: Dict = Depends(get_current_admin)):
    await experts.delete_one({"id": req.id})
    return {"message": "Removed"}

@router.get("/funding_requests")
async def get_funding_requests(admin: Dict = Depends(get_current_admin)):
    frs = await funding_requests.find().to_list(100)
    return frs

@router.post("/approve_funding")
async def approve_funding(req: ApproveFundingRequest, admin: Dict = Depends(get_current_admin)):
    fr = await funding_requests.find_one({"id": req.request_id})
    if not fr or fr["status"] != "pending":
        raise HTTPException(400, "Invalid request")
    await funding_requests.update_one({"id": req.request_id}, {"$set": {"status": "approved", "payment_info": req.payment_info}})
    return {"message": "Approved"}

@router.post("/deny_funding")
async def deny_funding(req: DenyRequest, admin: Dict = Depends(get_current_admin)):
    fr = await funding_requests.find_one({"id": req.request_id})
    if not fr or fr["status"] != "pending":
        raise HTTPException(400, "Invalid request")
    await funding_requests.update_one({"id": req.request_id}, {"$set": {"status": "denied"}})
    return {"message": "Denied"}

@router.post("/confirm_received")
async def confirm_received(req: DenyRequest, admin: Dict = Depends(get_current_admin)):
    fr = await funding_requests.find_one({"id": req.request_id})
    if not fr or fr["status"] != "paid":
        raise HTTPException(400, "Invalid request")
    await funding_requests.update_one({"id": req.request_id}, {"$set": {"status": "completed"}})
    await users.update_one({"email": fr["user_email"]}, {"$inc": {"balance": fr["amount"]}})
    return {"message": "Confirmed"}

@router.get("/withdrawal_requests")
async def get_withdrawal_requests(admin: Dict = Depends(get_current_admin)):
    wrs = await withdrawal_requests.find().to_list(100)
    return wrs

@router.post("/approve_withdrawal")
async def approve_withdrawal(req: DenyRequest, admin: Dict = Depends(get_current_admin)):
    wr = await withdrawal_requests.find_one({"id": req.request_id})
    if not wr or wr["status"] != "pending":
        raise HTTPException(400, "Invalid request")
    user = await users.find_one({"email": wr["user_email"]})
    if wr["amount"] > user["balance"]:
        raise HTTPException(400, "Insufficient balance")
    await users.update_one({"email": wr["user_email"]}, {"$inc": {"balance": -wr["amount"]}})
    await withdrawal_requests.update_one({"id": req.request_id}, {"$set": {"status": "approved"}})
    return {"message": "Approved"}

@router.post("/deny_withdrawal")
async def deny_withdrawal(req: DenyRequest, admin: Dict = Depends(get_current_admin)):
    wr = await withdrawal_requests.find_one({"id": req.request_id})
    if not wr or wr["status"] != "pending":
        raise HTTPException(400, "Invalid request")
    await withdrawal_requests.update_one({"id": req.request_id}, {"$set": {"status": "denied"}})
    return {"message": "Denied"}

@router.post("/send_alert")
async def send_alert(alert: SendAlert, admin: Dict = Depends(get_current_admin)):
    alert_doc = {"user_email": alert.email, "message": alert.message, "created_at": datetime.utcnow()}
    result = await user_alerts.insert_one(alert_doc)
    await manager.send_personal_message(json.dumps({"id": str(result.inserted_id), "message": alert.message}), alert.email)
    return {"message": "Alert sent"}

@router.post("/add_copying_plan")
async def add_copying_plan(plan: CopyingPlan, admin: Dict = Depends(get_current_admin)):
    await copying_plans.insert_one(plan.model_dump())
    return {"id": plan.id}

@router.post("/remove_copying_plan")
async def remove_copying_plan(req: RemovePlanRequest, admin: Dict = Depends(get_current_admin)):
    await copying_plans.delete_one({"id": req.id})
    return {"message": "Removed"}

@router.get("/copying_plans")
async def get_copying_plans(admin: Dict = Depends(get_current_admin)):
    plans = await copying_plans.find().to_list(100)
    return [{k: v for k, v in p.items() if k != "_id"} for p in plans]