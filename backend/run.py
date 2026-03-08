#!/usr/bin/env python3
"""
Start the Brainstorm Platform Service
"""
import uvicorn
from api.main import app
from core.config import settings

if __name__ == "__main__":
    print(f"""
    ╔═══════════════════════════════════════════════════════╗
    ║     🚀 Starting Brainstorm Platform Service          ║
    ║                                                       ║
    ║     Server: http://{settings.HOST}:{settings.PORT}                 ║
    ║     Docs:   http://localhost:{settings.PORT}/docs               ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "api.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,  # Disable reload to avoid import issues
        log_level="info"
    )
