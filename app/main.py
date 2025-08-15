from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.staticfiles import StaticFiles
from .routers import auth, user, admin
from .routers.auth import decode_token
from .connection_manager import ConnectionManager
from .database import user_alerts
import json
from pathlib import Path

app = FastAPI()

app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api/user")
app.include_router(admin.router, prefix="/api/admin")

manager = ConnectionManager()

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = decode_token(token)
        user_email = payload["email"]
        await manager.connect(websocket, user_email)

        async for alert in user_alerts.find({"user_email": user_email}):
            await manager.send_personal_message(
                json.dumps({"id": str(alert["_id"]), "message": alert["message"]}),
                user_email
            )

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_email)
    except:
        await websocket.close()

# Mount static files with a clear, non-conflicting structure.
# All static assets (including the user dashboard) are now served under `/static`.
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# The root mount for the E*TRADE public-facing site is last, as a catch-all.
app.mount("/", StaticFiles(directory="website", html=True), name="website")