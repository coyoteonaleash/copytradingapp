# copytrade_server/app/routers/user.py

# File: routers/user.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from ..models import Plan, CopyingPlan
from ..database import experts, funding_requests, withdrawal_requests, user_alerts, users, copying_plans
from .auth import get_current_user
import uuid
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/me")
async def get_me(user: Dict = Depends(get_current_user)):
    wins = user.get("wins", 0)
    losses = user.get("losses", 0)
    total_trades = wins + losses
    win_loss_ratio = f"{(wins / total_trades * 100):.2f}%" if total_trades > 0 else "0%"
    return {
        "email": user["email"],
        "username": user.get("username", ""),
        "balance": user["balance"],
        "profit": user.get("profit", 0.0),
        "total_bonus": user.get("total_bonus", 0.0),
        "win_loss_ratio": win_loss_ratio,
        "copied_traders": user["copied_traders"],
        "active_plans": user["active_plans"],
        "referrer_username": user.get("referrer_username"),
        "referred_users": user.get("referred_users", []),
        "verified": user.get("verified", False)
    }

@router.get("/experts")
async def get_experts():
    ex = await experts.find().to_list(100)
    return [{"id": e["id"], "name": e["name"], "description": e["description"], "photo_url": e["photo_url"]} for e in ex]

@router.post("/copy_trader")
async def copy_trader(trader_id: str, user: Dict = Depends(get_current_user)):
    ex = await experts.find_one({"id": trader_id})
    if not ex:
        raise HTTPException(404, "Trader not found")
    if trader_id in user["copied_traders"]:
        raise HTTPException(400, "Already copied")
    await users.update_one({"email": user["email"]}, {"$push": {"copied_traders": trader_id}})
    return {"message": "Added"}

@router.post("/funding_request")
async def funding_request(amount: float, user: Dict = Depends(get_current_user)):
    if amount <= 0:
        raise HTTPException(400, "Invalid amount")
    fr = {"id": str(uuid.uuid4()), "user_email": user["email"], "amount": amount, "status": "pending", "created_at": datetime.utcnow()}
    await funding_requests.insert_one(fr)
    return {"id": fr["id"]}

@router.get("/funding_requests")
async def get_funding_requests(user: Dict = Depends(get_current_user)):
    frs = await funding_requests.find({"user_email": user["email"]}).to_list(100)
    return frs

@router.post("/confirm_payment")
async def confirm_payment(request_id: str, user: Dict = Depends(get_current_user)):
    fr = await funding_requests.find_one({"id": request_id, "user_email": user["email"]})
    if not fr or fr["status"] != "approved":
        raise HTTPException(400, "Invalid request")
    await funding_requests.update_one({"id": request_id}, {"$set": {"status": "paid"}})
    return {"message": "Confirmed"}

@router.post("/withdrawal_request")
async def withdrawal_request(amount: float, account_details: Dict, user: Dict = Depends(get_current_user)):
    if amount <= 0 or amount > user["balance"]:
        raise HTTPException(400, "Invalid amount")
    wr = {"id": str(uuid.uuid4()), "user_email": user["email"], "amount": amount, "account_details": account_details, "status": "pending", "created_at": datetime.utcnow()}
    await withdrawal_requests.insert_one(wr)
    return {"id": wr["id"]}

@router.get("/withdrawal_requests")
async def get_withdrawal_requests(user: Dict = Depends(get_current_user)):
    wrs = await withdrawal_requests.find({"user_email": user["email"]}).to_list(100)
    return wrs

@router.get("/copying_plans")
async def get_copying_plans():
    plans = await copying_plans.find().to_list(100)
    return [{k: v for k, v in p.items() if k != "_id"} for p in plans]

@router.post("/subscribe_plan")
async def subscribe_plan(plan_id: str, amount: float, user: Dict = Depends(get_current_user)):
    plan = await copying_plans.find_one({"id": plan_id})
    if not plan:
        raise HTTPException(404, "Plan not found")
    if amount < plan["min_amount"] or amount > plan["max_amount"] or amount > user["balance"]:
        raise HTTPException(400, "Invalid amount")
    active_plan = {"plan_id": plan_id, "amount": amount, "activated_at": datetime.utcnow()}
    await users.update_one({"email": user["email"]}, {"$push": {"active_plans": active_plan}, "$inc": {"balance": -amount}})
    return {"message": "Subscribed"}

@router.get("/alerts", response_model=List[dict])
async def get_alerts(user: Dict = Depends(get_current_user)):
    alerts = await user_alerts.find({"user_email": user["email"]}).to_list(100)
    return [{"id": str(a["_id"]), "message": a["message"]} for a in alerts]

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, user: Dict = Depends(get_current_user)):
    try:
        object_id = ObjectId(alert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")

    result = await user_alerts.delete_one({"_id": object_id, "user_email": user["email"]})
    if result.deleted_count == 1:
        return {"message": "Alert deleted successfully"}
    raise HTTPException(status_code=404, detail="Alert not found or not authorized")

@router.get("/transactions")
async def get_transactions(user: Dict = Depends(get_current_user)):
    all_transactions = []

    # Funding requests
    funding_reqs = await funding_requests.find({"user_email": user["email"]}).to_list(100)
    for req in funding_reqs:
        all_transactions.append({
            "id": req["id"],
            "transaction_type": "funding",
            "amount": req["amount"],
            "date": req["created_at"],
            "status": req["status"]
        })

    # Withdrawal requests
    withdrawal_reqs = await withdrawal_requests.find({"user_email": user["email"]}).to_list(100)
    for req in withdrawal_reqs:
        all_transactions.append({
            "id": req["id"],
            "transaction_type": "withdrawal",
            "amount": req["amount"],
            "date": req["created_at"],
            "status": req["status"]
        })

    # Subscriptions from active plans
    if "active_plans" in user and user["active_plans"]:
        for plan in user["active_plans"]:
            all_transactions.append({
                "id": f"sub_{plan['plan_id']}_{plan['activated_at'].timestamp()}",
                "transaction_type": "subscription",
                "amount": plan["amount"],
                "date": plan["activated_at"],
                "status": "completed"
            })

    # Sort transactions by date, descending
    all_transactions.sort(key=lambda x: x["date"], reverse=True)

    return all_transactions