# AICT Health Profile

## Run locally

เปิด PowerShell ที่โฟลเดอร์ `good_tracking` แล้วรัน:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

หรือเปิดแยกสองหน้าต่าง:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm.cmd run dev
```

คำสั่ง `npm.cmd run dev` จะเปิด backend ที่พอร์ต `8000` ให้อัตโนมัติด้วย
จากนั้นเปิด URL ที่ Vite แสดงใน terminal (ปกติคือ `http://localhost:5173`).
ระหว่าง development frontend จะส่งคำขอ `/api` ผ่าน Vite proxy ไปยัง backend อัตโนมัติ

## Test

```powershell
cd backend
pytest -q

cd ..\frontend
npm.cmd run build
npm.cmd test -- --run
```
