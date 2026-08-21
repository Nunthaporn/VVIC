from collections.abc import Iterable
from datetime import date
from decimal import Decimal

def ratio_of_sums(rows: Iterable[dict]):
    valid = list(rows)
    denominator = sum(Decimal(str(r.get("min_input") or 0)) for r in valid)
    if denominator == 0: return None
    numerator = sum(Decimal(str(r.get("min_output") or 0)) for r in valid)
    return numerator / denominator

def period_start(latest: date, period: str):
    if period == "MTD": return latest.replace(day=1)
    if period == "QTD": return latest.replace(month=((latest.month-1)//3)*3+1, day=1)
    if period == "YTD": return latest.replace(month=1, day=1)
    raise ValueError("period must be MTD, QTD or YTD")

def period_eff(rows, latest: date, period: str):
    start = period_start(latest, period)
    return ratio_of_sums(r for r in rows if start <= r["data_date"] <= latest)
