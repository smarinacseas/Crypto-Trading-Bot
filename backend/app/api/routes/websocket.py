from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ...websocket_manager import websocket_manager
from ...core.auth import current_active_user
from ...models.user import User
import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle stream control messages
            if message.get("action") == "start_stream":
                stream_type = message.get("stream_type")
                symbol = message.get("symbol", "btcusdt")
                await websocket_manager.start_binance_stream(stream_type, symbol)
                
            elif message.get("action") == "stop_stream":
                stream_type = message.get("stream_type")
                symbol = message.get("symbol", "btcusdt")
                await websocket_manager.stop_binance_stream(stream_type, symbol)
                
            elif message.get("action") == "get_active_streams":
                active_streams = websocket_manager.get_active_streams()
                await websocket.send_text(json.dumps({
                    "type": "active_streams",
                    "streams": active_streams
                }))
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

@router.get("/streams/active")
async def get_active_streams():
    """Get currently active streams"""
    return {"active_streams": websocket_manager.get_active_streams()}

@router.post("/streams/start/{stream_type}")
async def start_stream(stream_type: str, symbol: str = "btcusdt"):
    """Start a specific stream type"""
    await websocket_manager.start_binance_stream(stream_type, symbol.lower())
    return {"message": f"Started {stream_type} stream for {symbol}"}

@router.post("/streams/stop/{stream_type}")
async def stop_stream(stream_type: str, symbol: str = "btcusdt"):
    """Stop a specific stream type"""
    await websocket_manager.stop_binance_stream(stream_type, symbol.lower())
    return {"message": f"Stopped {stream_type} stream for {symbol}"}