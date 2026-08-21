CREATE SCHEMA IF NOT EXISTS analytics;

-- Canonical web-facing contract. Adjust public source table names only in this view.
-- Excel/Power BI mapping: tEffData[Date] -> data_date, [Min Output] -> min_output,
-- [Min Input] -> min_input, [Cust_Type] -> customer_type, [Cust] -> customer,
-- [FACTORY] -> factory, [FAC-LINE] -> fac_line, [PD Name] -> pd_name,
-- [EasyLean Line] -> easy_lean_line, [Style] -> style, [PD_Type] -> product_type.
CREATE OR REPLACE VIEW analytics.v_eff_data AS
SELECT
    "Date"::date AS data_date,
    "Min Output"::numeric AS min_output,
    "Min Input"::numeric AS min_input,
    "Cust_Type"::text AS customer_type,
    "Cust"::text AS customer,
    "FACTORY"::text AS factory,
    "FAC-LINE"::text AS fac_line,
    "PD Name"::text AS pd_name,
    "EasyLean Line"::text AS easy_lean_line,
    "Style"::text AS style,
    "D_L"::text AS d_l,
    "Man"::numeric AS man,
    "Output pcs"::numeric AS output_pcs,
    "SAM"::numeric AS sam,
    "PD_Type"::text AS product_type,
    "BRAND_NAME"::text AS brand_name
FROM public."tEffData";

-- Run after confirming public."tEffData" is a physical table rather than a view.
-- CREATE INDEX CONCURRENTLY ix_teff_date_factory_customer
--   ON public."tEffData" ("Date", "FACTORY", "Cust_Type", "Cust");
-- CREATE INDEX CONCURRENTLY ix_teff_easy_lean
--   ON public."tEffData" ("EasyLean Line") WHERE NULLIF(TRIM("EasyLean Line"), '') IS NOT NULL;
