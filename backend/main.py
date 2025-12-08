# main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
# Import các router đã chia nhỏ
from api import ai_endpoints, media_endpoints 
# Lưu ý: core/config.py sẽ tự động chạy khi bạn import các file trên

app = FastAPI()

# --- Cấu hình Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ĐĂNG KÝ CÁC ENDPOINT ĐÃ CHIA NHỎ ---
# Sử dụng prefix /api để các endpoint trong router tự động có tiền tố /api
app.include_router(ai_endpoints.router, prefix="/api")
app.include_router(media_endpoints.router, prefix="/api") 

# --- Cấu hình Static Files (Frontend) ---
app.mount("/", 
          StaticFiles(directory="../frontend/public", html=True), 
          name="public")

# Lưu ý: Toàn bộ code load key, config model, và định nghĩa các hàm đã được chuyển đi.
# Bạn có thể chạy file này bằng lệnh: uvicorn main:app --reload