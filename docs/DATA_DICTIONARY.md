# Data Dictionary และ Power BI Mapping

แหล่งอ้างอิงหลักคือหน้า `VVIC` ใน PBIX และ Measures DAX ในไฟล์ประกอบ ส่วน Excel ใช้ตรวจชื่อคอลัมน์และตัวอย่างข้อมูลที่ใกล้เคียงฐานข้อมูล PostgreSQL เท่านั้น

| Web field | Power BI / Excel | ตาราง | ชนิด | การใช้งาน |
|---|---|---|---|---|
| data_date | Date | tEffData | date | LatestDate, MTD/QTD/YTD, เดือน |
| min_output | Min Output | tEffData | numeric | ตัวตั้ง EFF% |
| min_input | Min Input | tEffData | numeric | ตัวหาร EFF% |
| easy_lean_line | EasyLean Line | tEffData | text | เลือกเฉพาะค่าไม่ NULL/ไม่ว่าง |
| customer_type | Cust_Type / MT_CUS.VVIC | tEffData / MT_CUS | text | VVIC, NON-VVIC |
| customer | Cust / MT_CUS.BRAND_NAME | tEffData / MT_CUS | text | Ranking และ Filter |
| factory | FACTORY / MT_FACTORY.FACTORY | tEffData / MT_FACTORY | text | G1–G4, TRM, EA |
| fac_line | FAC-LINE | tEffData | text | Filter/Detail |
| pd_name | PD Name | tEffData | text | Line-level KPI |
| style | Style | tEffData | text | Filter/Detail |
| d_l | D_L | tEffData | text | Unique manpower grouping |
| man | Man | tEffData | numeric | Manpower |
| output_pcs | Output pcs | tEffData | numeric | PPH / Weighted SAM |
| plan_mgr | Plan MGR | tMGR | numeric | PTP% |

## Measure Mapping

| Power BI Measure | Business Meaning | Required Columns | Filter Context | Backend/API |
|---|---|---|---|---|
| EFF% / EFF% EZL | Ratio of sums เฉพาะ EasyLean | min_output, min_input, easy_lean_line | Filters ปัจจุบัน | monthly/factory/customer endpoints |
| YTD EFF% | ตั้งแต่ 1 ม.ค. ถึง latest filtered date | data_date + EFF fields | Customer, Factory, Date | summary.ytd_eff_pct |
| QTD EFF% | ต้นไตรมาสถึง latest filtered date | เหมือน YTD | เหมือน YTD | summary.qtd_eff_pct |
| MTD EFF% | ต้นเดือนถึง latest filtered date | เหมือน YTD | เหมือน YTD | summary.mtd_eff_pct |
| Latest Refresh Date | วันเวลา Refresh | RefreshDate[Refresh Date] | ไม่ขึ้นกับ Date slicer | last-refresh |

## Relationships ที่พบจาก PBIX Visual Queries

- `Date` เป็น Date dimension ที่ส่ง filter ไปยังข้อมูลประสิทธิภาพ
- `MT_CUS` เป็น Customer dimension; visuals ใช้ `MT_CUS.VVIC` และ `MT_CUS.BRAND_NAME`
- `MT_FACTORY` เป็น Factory dimension; visuals ใช้ `MT_FACTORY.FACTORY`
- `KeyMeasure` เป็น measure table ไม่มี physical join สำหรับข้อมูลธุรกรรม
- `tMGR` ต้อง aggregate แยกก่อน join กับ EFF เพื่อป้องกัน fan-out

คีย์และ cardinality จริงของ relationship ไม่สามารถยืนยันจาก Report Layout เพียงอย่างเดียว จึงตั้ง canonical view ให้ใช้คอลัมน์ใน `tEffData` โดยตรงสำหรับ dashboard หลัก และระบุรายการนี้เป็นจุดตรวจสอบก่อน Production cutover
