# สรุปก่อนพัฒนา

## โครงสร้างหน้า VVIC จาก PBIX

- Header: Customer type, Date range, Factory slicer, refresh time
- KPI: YTD, QTD, MTD EFF% (format 0.00%)
- Line: `Date.Year Month` × `MT_CUS.VVIC` × `KeyMeasure.EFF%`
- Factory: Month × `MT_FACTORY.FACTORY` × EFF%
- Ranking: `MT_CUS.BRAND_NAME` × EFF%, เรียงมากไปน้อย, Target 0.60

## สูตรที่ยืนยันแล้ว

`EFF% = SUM(Min Output) / NULLIF(SUM(Min Input), 0)` โดยเก็บเฉพาะ `EasyLean Line` ที่ไม่ NULL และไม่ว่าง Backend คืน decimal 0–1; Frontend เป็นผู้ format `%` หากไม่มีข้อมูลคืน NULL และแสดง `N/A`.

## Filter Context

latest filtered date คือ MAX(Date) ที่อยู่ในช่วงและ Filter ปัจจุบัน จากนั้น MTD/QTD/YTD เปลี่ยนเฉพาะจุดเริ่มต้น แต่คง end date เป็น latest date และคง Factory/Customer filters ทั้งตัวตั้งและตัวหาร

## ข้อมูลที่ยังต้องยืนยันก่อน Production

1. ชื่อตาราง PostgreSQL จริงและ case-sensitive identifiers ว่าคือ `public."tEffData"` หรือชื่ออื่น
2. Physical relationship keys/cardinality ของ tEffData↔MT_CUS, tEffData↔MT_FACTORY, Date และ tMGR
3. `Cust_Type` ในฐานข้อมูลใช้ `NON-VVIC` ตรงกันหรือใช้ค่าอื่น
4. ต้องการให้ `start_date` จำกัดข้อมูล YTD/QTD/MTD ด้วยหรือให้ time-intelligence ขยายย้อนถึงต้น period ตาม DAX
5. ค่า Power BI จริงสำหรับ Validation Report โดยใช้ filter snapshot เดียวกัน
