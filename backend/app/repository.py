from sqlalchemy import text


# =========================================================
# FILTERS
# =========================================================

DIMENSION_FILTER = """
(
    CAST(:factories AS text[]) IS NULL
    OR e."FACTORY" = ANY(CAST(:factories AS text[]))
)
AND (
    CAST(:customer AS text) IS NULL
    OR e."BRAND_NAME" = CAST(:customer AS text)
)
AND (
    CAST(:customer_type AS text) = 'ALL'
    OR e."Cust_Type" = CAST(:customer_type AS text)
)
"""


DATE_AND_DIMENSION_FILTER = f"""
e."Date"::date BETWEEN :start_date AND :end_date
AND {DIMENSION_FILTER}
"""


# =========================================================
# SUMMARY
# YTD / QTD / MTD
# =========================================================

def summary_query():
    return text(f"""
WITH filtered_context AS (
    SELECT
        MAX(e."Date"::date) AS latest_date

    FROM public.teffdata e

    WHERE {DATE_AND_DIMENSION_FILTER}
),

periods AS (
    SELECT
        latest_date,

        GREATEST(
            date_trunc('year', latest_date)::date,
            CAST(:start_date AS date)
        ) AS ytd_start,

        GREATEST(
            date_trunc('quarter', latest_date)::date,
            CAST(:start_date AS date)
        ) AS qtd_start,

        GREATEST(
            date_trunc('month', latest_date)::date,
            CAST(:start_date AS date)
        ) AS mtd_start

    FROM filtered_context
)

SELECT
    p.latest_date AS data_as_of,

    (
        SUM(e."Min Output") FILTER (
            WHERE e."Date"::date
            BETWEEN p.ytd_start AND p.latest_date
        )
    )::numeric
    /
    NULLIF(
        SUM(e."Min Input") FILTER (
            WHERE e."Date"::date
            BETWEEN p.ytd_start AND p.latest_date
        ),
        0
    ) AS ytd_eff_pct,

    (
        SUM(e."Min Output") FILTER (
            WHERE e."Date"::date
            BETWEEN p.qtd_start AND p.latest_date
        )
    )::numeric
    /
    NULLIF(
        SUM(e."Min Input") FILTER (
            WHERE e."Date"::date
            BETWEEN p.qtd_start AND p.latest_date
        ),
        0
    ) AS qtd_eff_pct,

    (
        SUM(e."Min Output") FILTER (
            WHERE e."Date"::date
            BETWEEN p.mtd_start AND p.latest_date
        )
    )::numeric
    /
    NULLIF(
        SUM(e."Min Input") FILTER (
            WHERE e."Date"::date
            BETWEEN p.mtd_start AND p.latest_date
        ),
        0
    ) AS mtd_eff_pct

FROM public.teffdata e
CROSS JOIN periods p

WHERE
    p.latest_date IS NOT NULL

AND e."Date"::date
    BETWEEN CAST(:start_date AS date)
        AND p.latest_date

AND {DIMENSION_FILTER}

GROUP BY
    p.latest_date
""")


# =========================================================
# MONTHLY COMPARISON
# =========================================================

def monthly_query():
    return text("""
SELECT
    to_char(
        date_trunc(
            'month',
            e."Date"::date
        ),
        'YYYY-MM'
    ) AS month,

    e."Cust_Type" AS customer_type,

    SUM(e."Min Output")::numeric
    /
    NULLIF(
        SUM(e."Min Input"),
        0
    ) AS eff_pct

FROM public.teffdata e

WHERE
    e."Date"::date
    BETWEEN :start_date
    AND :end_date

AND (
    CAST(:factories AS text[]) IS NULL
    OR e."FACTORY"
       = ANY(
           CAST(:factories AS text[])
         )
)

AND (
    CAST(:customer AS text) IS NULL
    OR e."BRAND_NAME"
       = CAST(:customer AS text)
)

AND e."Cust_Type" IN (
    'VVIC',
    'NON-VVIC'
)

GROUP BY
    1,
    2

ORDER BY
    1,
    2
""")


# =========================================================
# FACTORY MONTHLY
# =========================================================

def factory_query():

    return text(f"""
SELECT

    to_char(
        date_trunc(
            'month',
            e."Date"::date
        ),
        'YYYY-MM'
    ) AS month,

    e."FACTORY" AS factory,

    SUM(e."Min Output")::numeric
    /
    NULLIF(
        SUM(e."Min Input"),
        0
    ) AS eff_pct


FROM public.teffdata e


WHERE {DATE_AND_DIMENSION_FILTER}


GROUP BY
    1,
    2


ORDER BY
    1,
    2
""")


# =========================================================
# FACTORY PRODUCT BREAKDOWN
# =========================================================

def factory_product_query():

    return text(f"""
SELECT

    to_char(
        date_trunc(
            'month',
            e."Date"::date
        ),
        'YYYY-MM'
    ) AS month,

    e."FACTORY" AS factory,

    COALESCE(
        NULLIF(
            TRIM(e."PD_Type"),
            ''
        ),
        'OTHER'
    ) AS product_type,

    SUM(e."Min Output")::numeric
    /
    NULLIF(
        SUM(e."Min Input"),
        0
    ) AS eff_pct


FROM public.teffdata e


WHERE {DATE_AND_DIMENSION_FILTER}


GROUP BY
    1,
    2,
    3


ORDER BY
    1,
    2,
    4 DESC
""")


# =========================================================
# CUSTOMER MTD
# =========================================================

def customer_mtd_query():
    return text(f"""
SELECT
    e."BRAND_NAME" AS customer,

    to_char(
        MAX(e."Date"::date),
        'YYYY-MM'
    ) AS month,

    SUM(e."Min Output")::numeric
    /
    NULLIF(
        SUM(e."Min Input"),
        0
    ) AS eff_pct

FROM public.teffdata e

WHERE
    e."Date"::date
    BETWEEN :start_date AND :end_date

AND (
    CAST(:factories AS text[]) IS NULL
    OR e."FACTORY" = ANY(
        CAST(:factories AS text[])
    )
)

AND (
    CAST(:customer AS text) IS NULL
    OR e."BRAND_NAME" = CAST(:customer AS text)
)

AND (
    CAST(:customer_type AS text) = 'ALL'
    OR e."Cust_Type" = CAST(:customer_type AS text)
)

AND NULLIF(
    TRIM(e."BRAND_NAME"),
    ''
) IS NOT NULL

GROUP BY
    e."BRAND_NAME"

ORDER BY
    eff_pct DESC
""")

# =========================================================
# CUSTOMER FACTORY MTD
# =========================================================

def customer_factory_mtd_query():
    return text(f"""
SELECT
    e."BRAND_NAME" AS customer,

    e."FACTORY" AS factory,

    to_char(
        MAX(e."Date"::date),
        'YYYY-MM'
    ) AS month,

    SUM(e."Min Output")::numeric
    /
    NULLIF(
        SUM(e."Min Input"),
        0
    ) AS eff_pct

FROM public.teffdata e

WHERE
    e."Date"::date
    BETWEEN :start_date AND :end_date

AND (
    CAST(:factories AS text[]) IS NULL
    OR e."FACTORY" = ANY(
        CAST(:factories AS text[])
    )
)

AND (
    CAST(:customer AS text) IS NULL
    OR e."BRAND_NAME" = CAST(:customer AS text)
)

AND (
    CAST(:customer_type AS text) = 'ALL'
    OR e."Cust_Type" = CAST(:customer_type AS text)
)

AND NULLIF(
    TRIM(e."BRAND_NAME"),
    ''
) IS NOT NULL

GROUP BY
    e."BRAND_NAME",
    e."FACTORY"

ORDER BY
    e."BRAND_NAME",
    eff_pct DESC
""")