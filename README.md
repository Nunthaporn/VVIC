# VVIC CUSTOMER EFF Dashboard

Web Application ทดแทนหน้า `VVIC` ใน Power BI: React + TypeScript + Tailwind CSS + Apache ECharts เรียกข้อมูลผ่าน FastAPI + SQLAlchemy เท่านั้น รองรับ PostgreSQL และแยก Mock/Production ชัดเจน

## เปิดใช้งานแบบ Mock

ต้องติดตั้ง Node.js 20+ และ Python 3.12+

```powershell
cd frontend
npm install
npm run dev
```

เปิด Terminal อีกหน้าหนึ่ง:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

เปิด `http://localhost:5173/` หรือ `http://172.16.88.141:5173/` เมื่อเครื่องอนุญาต Network access

## เชื่อม PostgreSQL จริง

1. สร้าง `backend/.env` จาก `.env.example`
2. ใส่ค่าจริงโดยไม่ commit รหัสผ่าน:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/VVIC
DATA_MODE=database
CORS_ORIGINS=http://localhost:5173,http://172.16.88.141:5173
```

3. ฐานข้อมูลใหม่: ตรวจ/แก้ชื่อตารางต้นทางใน `database/001_schema_and_view.sql` แล้วรัน SQL
   ฐานข้อมูลเดิม: รัน `database/003_add_product_type_tooltip.sql` และ `database/004_add_brand_name.sql` ตามลำดับหนึ่งครั้ง
4. Refresh หน้าเว็บ

รหัสผ่านที่ผู้ใช้ส่งมาไม่ถูกบันทึกลง source code; `.env.example` ใช้ placeholder เพื่อความปลอดภัย

## Docker

สร้าง `backend/.env` ก่อน แล้วรัน:

```bash
docker compose up --build
```

## API

- `GET /api/dashboard/summary`
- `GET /api/dashboard/monthly-comparison`
- `GET /api/dashboard/factory-monthly`
- `GET /api/dashboard/factory-product-breakdown`
- `GET /api/dashboard/customer-mtd`
- `GET /api/dashboard/customer-factory-mtd`
- `GET /api/dashboard/details?page=1&page_size=50`
- `GET /api/dashboard/filters`
- `GET /api/dashboard/last-refresh`
- `GET /api/health`

รองรับ `start_date`, `end_date`, `customer_type`, `factory` (ส่งซ้ำเพื่อ multi-select), `customer`, `target`, `page`, `page_size` ตาม endpoint

## Tests

```bash
cd backend
python -m unittest discover -s tests -v
```

ครอบคลุม Ratio of Sums, EasyLean blank, zero denominator และ period boundaries เบื้องต้น รายการ validation ที่ต้องเทียบกับ Power BI อยู่ใน `docs/POWER_BI_VALIDATION.csv`

## Production Notes

- Frontend ยกเลิก request เก่าด้วย AbortController เมื่อ Filter เปลี่ยนเร็ว
- SQL ใช้ parameterized queries และ aggregate ที่ฐานข้อมูล
- เพิ่ม index หลังตรวจว่าตารางต้นทางเป็น physical table
- Login/Role ควรต่อกับองค์กรผ่าน OIDC; โครง API พร้อมแยก Admin/Viewer middleware ในระยะถัดไป แต่ยังไม่เปิด authentication ปลอม
