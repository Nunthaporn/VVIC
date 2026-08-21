-- Run once on an existing VVIC database for BRAND_NAME ranking and tooltip.
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
