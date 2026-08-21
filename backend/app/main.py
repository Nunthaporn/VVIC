from datetime import date, datetime
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from .config import get_settings
from .database import get_db
from . import mock_data, repository

s=get_settings(); app=FastAPI(title=s.app_name, version="1.0.0")
app.add_middleware(CORSMiddleware,allow_origins=s.cors_origin_list,allow_methods=["GET"],allow_headers=["*"],allow_credentials=False)

def params(start_date:date|None,end_date:date|None,customer_type:str,factory:list[str],customer:str|None):
    if start_date and end_date and start_date>end_date: raise HTTPException(422,"start_date must be before end_date")
    return {"start_date":start_date or date(2023,9,1),"end_date":end_date or date.today(),"customer_type":customer_type.upper(),"factories":factory or None,"customer":customer}

@app.get('/api/health')
def health(db:Session=Depends(get_db)):
    if s.data_mode=='mock': return {"status":"ok","database":"mock"}
    try: db.execute(text('SELECT 1')); return {"status":"ok","database":"connected"}
    except Exception: raise HTTPException(503,"Database unavailable")

@app.get('/api/dashboard/summary')
def summary(start_date:date|None=None,end_date:date|None=None,customer_type:str='ALL',factory:list[str]=Query(default=[]),customer:str|None=None,db:Session=Depends(get_db)):
    p=params(start_date,end_date,customer_type,factory,customer)
    if s.data_mode=='mock': return mock_data.summary(p)
    row=db.execute(repository.summary_query(),p).mappings().first()
    return {**(dict(row) if row else {"data_as_of":None,"ytd_eff_pct":None,"qtd_eff_pct":None,"mtd_eff_pct":None}),"last_refresh":datetime.now().astimezone(),"active_filters":p}

@app.get('/api/dashboard/monthly-comparison')
def monthly_comparison(start_date:date|None=None,end_date:date|None=None,customer_type:str='ALL',factory:list[str]=Query(default=[]),customer:str|None=None,db:Session=Depends(get_db)):
    p=params(start_date,end_date,customer_type,factory,customer)
    if s.data_mode=='mock': return mock_data.monthly(factory,customer,p['start_date'],p['end_date'])
    rows=db.execute(repository.monthly_query(),p).mappings(); out={}
    for r in rows: out.setdefault(r['month'],{"month":r['month'],"vvic":None,"non_vvic":None})['vvic' if r['customer_type']=='VVIC' else 'non_vvic']=r['eff_pct']
    return list(out.values())

@app.get('/api/dashboard/factory-monthly')
def factory_monthly(start_date:date|None=None,end_date:date|None=None,customer_type:str='ALL',factory:list[str]=Query(default=[]),customer:str|None=None,db:Session=Depends(get_db)):
    p=params(start_date,end_date,customer_type,factory,customer)
    return mock_data.factory_monthly(factory,customer,p['start_date'],p['end_date']) if s.data_mode=='mock' else [dict(x) for x in db.execute(repository.factory_query(),p).mappings()]

@app.get('/api/dashboard/factory-product-breakdown')
def factory_product_breakdown(start_date:date|None=None,end_date:date|None=None,customer_type:str='ALL',factory:list[str]=Query(default=[]),customer:str|None=None,db:Session=Depends(get_db)):
    p=params(start_date,end_date,customer_type,factory,customer)
    return mock_data.factory_product_breakdown(factory,customer,p['start_date'],p['end_date']) if s.data_mode=='mock' else [dict(x) for x in db.execute(repository.factory_product_query(),p).mappings()]

@app.get('/api/dashboard/customer-mtd')
def customer_mtd(target:float=0.60,start_date:date|None=None,end_date:date|None=None,customer_type:str='VVIC',factory:list[str]=Query(default=[]),customer:str|None=None,db:Session=Depends(get_db)):
    p=params(start_date,end_date,customer_type,factory,customer)
    if s.data_mode=='mock': return mock_data.customer_mtd(target,factory,customer,p['end_date'])
    return [{**dict(x),"target":target} for x in db.execute(repository.customer_mtd_query(),p).mappings()]

@app.get('/api/dashboard/customer-factory-mtd')
def customer_factory_mtd(start_date:date|None=None,end_date:date|None=None,customer_type:str='VVIC',factory:list[str]=Query(default=[]),customer:str|None=None,db:Session=Depends(get_db)):
    p=params(start_date,end_date,customer_type,factory,customer)
    if s.data_mode=='mock': return mock_data.customer_factory_mtd(factory,customer,p['end_date'])
    return [dict(x) for x in db.execute(repository.customer_factory_mtd_query(),p).mappings()]

@app.get('/api/dashboard/filters')
def filters(): return {"customer_types":["VVIC","NON-VVIC"],"factories":["G1","G2","G3","G4","TRM","EA"],"default_target":s.default_target}
@app.get('/api/dashboard/last-refresh')
def last_refresh(): return {"last_refresh":mock_data.LAST_REFRESH if s.data_mode=='mock' else datetime.now().astimezone()}
@app.get('/api/dashboard/details')
def details(page:int=1,page_size:int=Query(50,le=200)): return {"items":[],"page":page,"page_size":page_size,"total":0}
