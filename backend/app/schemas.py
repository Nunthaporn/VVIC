from datetime import date, datetime
from pydantic import BaseModel, Field

class Summary(BaseModel):
    data_as_of: date | None
    last_refresh: datetime
    ytd_eff_pct: float | None
    qtd_eff_pct: float | None
    mtd_eff_pct: float | None
    active_filters: dict

class MonthlyPoint(BaseModel):
    month: str
    vvic: float | None = None
    non_vvic: float | None = None

class FactoryPoint(BaseModel):
    month: str
    factory: str
    eff_pct: float | None

class FactoryProductPoint(BaseModel):
    month: str
    factory: str
    product_type: str
    eff_pct: float | None

class CustomerPoint(BaseModel):
    customer: str
    factory: str
    month: str
    eff_pct: float | None
    target: float

class CustomerFactoryPoint(BaseModel):
    customer: str
    factory: str
    month: str
    eff_pct: float | None

class FilterParams(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    customer_type: str = "ALL"
    factory: list[str] = Field(default_factory=list)
    customer: str | None = None
