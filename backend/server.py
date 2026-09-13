from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

import auth as auth_utils
from analysis import analyze_website, compute_overall, SCORE_WEIGHTS, build_insights_prompt, INSIGHTS_SYSTEM
from llm_service import llm_json
import demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("competitor_intel")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="AI Competitor Intelligence")
api = APIRouter(prefix="/api")

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


# ---------------- Models ----------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = "there"


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    password: str = Field(min_length=6)


class CompetitorBody(BaseModel):
    company_name: str
    industry: str
    website: str
    product_name: str | None = None
    product_category: str | None = None
    target_market: str | None = None
    notes: str | None = ""


class OurProductBody(BaseModel):
    company: dict = {}
    product: dict = {}


class AnalyzeOwnBody(BaseModel):
    company_name: str
    industry: str
    website: str
    product_name: str | None = None


class ActionStatusBody(BaseModel):
    status: str


# ---------------- Dependencies ----------------
async def current_user(request: Request) -> dict:
    return await auth_utils.get_current_user_from_request(request, db)


def _validate_origin(request: Request):
    origins = os.environ.get("CORS_ORIGINS", "").split(",")
    origin = request.headers.get("origin")
    if origin and origin not in origins:
        raise HTTPException(status_code=403, detail="Origin not allowed")


# ---------------- Auth routes ----------------
@api.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": auth_utils.hash_password(body.password),
        "name": body.name or "there",
        "role": "user",
        "onboarding_completed": False,
        "has_real_product": False,
        "created_at": datetime.now(timezone.utc),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    await _seed_user_demo(uid)
    access = auth_utils.create_access_token(uid, email)
    refresh = auth_utils.create_refresh_token(uid)
    auth_utils.set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": doc["name"], "role": "user",
            "onboarding_completed": False, "has_real_product": False, "token": access}


@api.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= MAX_ATTEMPTS:
        locked_until = attempt.get("locked_until")
        if locked_until and locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    user = await db.users.find_one({"email": email})
    if not user or not auth_utils.verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)}},
            upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    access = auth_utils.create_access_token(uid, email)
    refresh = auth_utils.create_refresh_token(uid)
    auth_utils.set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": user.get("name"), "role": user.get("role", "user"),
            "onboarding_completed": user.get("onboarding_completed", False),
            "has_real_product": user.get("has_real_product", False), "token": access}


@api.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(current_user)):
    auth_utils.clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return {"id": user["_id"], "email": user["email"], "name": user.get("name"),
            "role": user.get("role", "user"),
            "onboarding_completed": user.get("onboarding_completed", False),
            "has_real_product": user.get("has_real_product", False)}


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    import jwt
    try:
        payload = jwt.decode(token, auth_utils.get_jwt_secret(), algorithms=[auth_utils.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = auth_utils.create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access, httponly=True,
                            secure=True, samesite="lax", max_age=604800, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": str(user["_id"]),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1), "used": False})
        link = f"{os.environ.get('FRONTEND_URL')}/reset-password?token={token}"
        logger.info(f"[PASSWORD RESET] {body.email}: {link}")
    return {"ok": True, "message": "If the email exists, a reset link has been sent."}


@api.post("/auth/reset-password")
async def reset_password(body: ResetBody):
    rec = await db.password_reset_tokens.find_one({"token": body.token})
    if not rec or rec.get("used") or rec["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await db.users.update_one({"_id": ObjectId(rec["user_id"])},
                              {"$set": {"password_hash": auth_utils.hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True}


# ---------------- Helpers ----------------
async def _seed_user_demo(uid: str):
    op = dict(demo_data.DEMO_OUR_PRODUCT)
    op["user_id"] = uid
    op["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.our_product.insert_one(op)
    for c in demo_data.DEMO_COMPETITORS:
        comp = demo_data.build_demo_competitor(uid, c)
        await db.competitors.insert_one(comp)
        for h in demo_data.build_demo_history(uid, comp):
            await db.competitor_history.insert_one(h)


async def _user_has_real(uid: str) -> bool:
    if await db.our_product.find_one({"user_id": uid, "is_demo": {"$ne": True}}):
        return True
    if await db.competitors.find_one({"user_id": uid, "is_demo": {"$ne": True}}):
        return True
    return False


def _clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


async def _get_baseline(uid: str) -> dict:
    real = await db.our_product.find_one({"user_id": uid, "is_demo": {"$ne": True}})
    op = real or await db.our_product.find_one({"user_id": uid, "is_demo": True})
    return _clean(op) if op else None


# ---------------- Our Product ----------------
@api.get("/our-product")
async def get_our_product(user: dict = Depends(current_user)):
    op = await _get_baseline(user["_id"])
    return op or {}


@api.put("/our-product")
async def update_our_product(body: OurProductBody, user: dict = Depends(current_user)):
    uid = user["_id"]
    existing = await db.our_product.find_one({"user_id": uid, "is_demo": {"$ne": True}})
    product = body.product or {}
    label = product.get("name") or (existing.get("label") if existing else "Our Product")
    payload = {
        "user_id": uid, "is_demo": False, "label": label,
        "company": body.company, "product": product,
        "value_propositions": [v for v in [product.get("value_proposition")] if v],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if existing:
        # keep prior analysis-derived fields
        for k in ("pricing", "features", "scores", "overall", "confidence", "key_strength",
                  "key_weakness", "source_url"):
            if k in existing:
                payload[k] = existing[k]
        await db.our_product.update_one({"_id": existing["_id"]}, {"$set": payload})
    else:
        await db.our_product.insert_one(payload)
    await db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"has_real_product": True}})
    return await _get_baseline(uid)


@api.post("/our-product/analyze")
async def analyze_own(body: AnalyzeOwnBody, user: dict = Depends(current_user)):
    uid = user["_id"]
    try:
        result = await analyze_website(body.company_name, body.industry, body.website)
    except Exception as e:
        logger.exception("own analyze failed")
        raise HTTPException(status_code=502, detail=f"Could not analyze website: {str(e)[:200]}")
    label = body.product_name or body.company_name
    payload = {
        "user_id": uid, "is_demo": False, "label": label,
        "company": {"name": body.company_name, "industry": body.industry,
                    "website": body.website, "description": result.get("description")},
        "product": {"name": label, "url": body.website,
                    "description": result.get("description"),
                    "target_customers": result.get("target_customers"),
                    "value_proposition": (result.get("value_propositions") or [None])[0]},
        "value_propositions": result.get("value_propositions", []),
        "pricing": result.get("pricing"),
        "features": result.get("features", []),
        "scores": result.get("scores", {}),
        "overall": result.get("overall"),
        "confidence": result.get("confidence"),
        "key_strength": result.get("key_strength"),
        "key_weakness": result.get("key_weakness"),
        "source_url": result.get("source_url"),
        "last_analyzed": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    existing = await db.our_product.find_one({"user_id": uid, "is_demo": {"$ne": True}})
    if existing:
        await db.our_product.update_one({"_id": existing["_id"]}, {"$set": payload})
    else:
        await db.our_product.insert_one(payload)
    await db.users.update_one({"_id": ObjectId(uid)},
                              {"$set": {"has_real_product": True, "onboarding_completed": True}})
    return await _get_baseline(uid)


# ---------------- Competitors ----------------
@api.get("/competitors")
async def list_competitors(user: dict = Depends(current_user), include_demo: bool | None = None):
    uid = user["_id"]
    has_real = await _user_has_real(uid)
    show_demo = include_demo if include_demo is not None else (not has_real)
    query = {"user_id": uid}
    if not show_demo:
        query["is_demo"] = {"$ne": True}
    docs = await db.competitors.find(query).sort("created_at", 1).to_list(500)
    return [_clean(d) for d in docs]


@api.post("/competitors")
async def add_competitor(body: CompetitorBody, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["_id"], "is_demo": False,
        "company_name": body.company_name, "industry": body.industry, "website": body.website,
        "product_name": body.product_name, "product_category": body.product_category,
        "target_market": body.target_market, "notes": body.notes or "",
        "status": "pending", "last_analyzed": None,
        "created_at": datetime.now(timezone.utc).isoformat(), "analysis": None,
    }
    await db.competitors.insert_one(doc)
    return _clean(doc)


@api.get("/competitors/{cid}")
async def get_competitor(cid: str, user: dict = Depends(current_user)):
    doc = await db.competitors.find_one({"id": cid, "user_id": user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return _clean(doc)


@api.post("/competitors/{cid}/analyze")
async def analyze_competitor(cid: str, user: dict = Depends(current_user)):
    doc = await db.competitors.find_one({"id": cid, "user_id": user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Competitor not found")
    await db.competitors.update_one({"id": cid}, {"$set": {"status": "analyzing"}})
    try:
        result = await analyze_website(doc["company_name"], doc["industry"], doc["website"])
    except Exception as e:
        logger.exception("competitor analyze failed")
        await db.competitors.update_one({"id": cid}, {"$set": {"status": "error"}})
        raise HTTPException(status_code=502, detail=f"Could not analyze website: {str(e)[:200]}")
    await db.competitors.update_one({"id": cid}, {"$set": {
        "status": "analyzed", "analysis": result,
        "last_analyzed": datetime.now(timezone.utc).strftime("%Y-%m-%d")}})
    await _record_history(user["_id"], cid, doc["company_name"], result)
    updated = await db.competitors.find_one({"id": cid})
    return _clean(updated)


async def _record_history(uid, cid, company_name, result):
    now = datetime.now(timezone.utc)
    pricing = result.get("pricing") or {}
    await db.competitor_history.insert_one({
        "id": str(uuid.uuid4()), "user_id": uid, "competitor_id": cid,
        "company_name": company_name,
        "analyzed_at": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "overall": result.get("overall"),
        "scores": result.get("scores", {}),
        "starting_price": pricing.get("starting_price"),
        "confidence": result.get("confidence"),
        "feature_count": len(result.get("features", []) or []),
    })


@api.get("/competitors/{cid}/history")
async def competitor_history(cid: str, user: dict = Depends(current_user)):
    comp = await db.competitors.find_one({"id": cid, "user_id": user["_id"]})
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    docs = await db.competitor_history.find(
        {"competitor_id": cid, "user_id": user["_id"]}).sort("analyzed_at", 1).to_list(500)
    return [_clean(d) for d in docs]


@api.delete("/competitors/{cid}")
async def delete_competitor(cid: str, user: dict = Depends(current_user)):
    res = await db.competitors.delete_one({"id": cid, "user_id": user["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Competitor not found")
    await db.competitor_history.delete_many({"competitor_id": cid, "user_id": user["_id"]})
    return {"ok": True}


# ---------------- Dashboard aggregate ----------------
@api.get("/dashboard")
async def dashboard(user: dict = Depends(current_user), include_demo: bool | None = None):
    uid = user["_id"]
    baseline = await _get_baseline(uid)
    has_real = await _user_has_real(uid)
    show_demo = include_demo if include_demo is not None else (not has_real)
    query = {"user_id": uid, "status": "analyzed"}
    if not show_demo:
        query["is_demo"] = {"$ne": True}
    comps = await db.competitors.find(query).sort("created_at", 1).to_list(500)
    return {
        "baseline": baseline,
        "competitors": [_clean(c) for c in comps],
        "has_real_product": has_real,
        "scoring": {"weights": SCORE_WEIGHTS},
    }


# ---------------- Insights ----------------
def _flatten_comp(c):
    a = c.get("analysis") or {}
    return {**a, "company_name": c.get("company_name")}


@api.get("/insights")
async def get_insights(user: dict = Depends(current_user)):
    rec = await db.insights.find_one({"user_id": user["_id"]})
    return _clean(rec) if rec else {}


@api.post("/insights/generate")
async def generate_insights(user: dict = Depends(current_user), include_demo: bool | None = None):
    uid = user["_id"]
    baseline = await _get_baseline(uid)
    if not baseline:
        raise HTTPException(status_code=400, detail="No baseline product found")
    has_real = await _user_has_real(uid)
    show_demo = include_demo if include_demo is not None else (not has_real)
    query = {"user_id": uid, "status": "analyzed"}
    if not show_demo:
        query["is_demo"] = {"$ne": True}
    comps = await db.competitors.find(query).sort("created_at", 1).to_list(500)
    if not comps:
        raise HTTPException(status_code=400, detail="Analyze at least one competitor first")
    flat = [_flatten_comp(c) for c in comps]
    prompt = build_insights_prompt(baseline, flat)
    try:
        data = await llm_json(INSIGHTS_SYSTEM, prompt, session_id=f"insights-{uid}")
    except Exception as e:
        logger.exception("insights failed")
        raise HTTPException(status_code=502, detail=f"Insight generation failed: {str(e)[:200]}")
    data["user_id"] = uid
    data["generated_at"] = datetime.now(timezone.utc).isoformat()
    await db.insights.update_one({"user_id": uid}, {"$set": data}, upsert=True)
    await _sync_actions(uid, data.get("recommended_actions", []))
    return _clean(await db.insights.find_one({"user_id": uid}))


async def _sync_actions(uid, recommended):
    existing = {a["action"]: a for a in await db.actions.find({"user_id": uid}).to_list(500)}
    await db.actions.delete_many({"user_id": uid})
    for r in recommended:
        prev = existing.get(r.get("action"))
        await db.actions.insert_one({
            "id": str(uuid.uuid4()), "user_id": uid,
            "priority": r.get("priority"), "action": r.get("action"),
            "reason": r.get("reason"), "impact": r.get("impact"),
            "status": prev["status"] if prev else "not_started",
        })


# ---------------- Actions ----------------
@api.get("/actions")
async def list_actions(user: dict = Depends(current_user)):
    order = {"P0": 0, "P1": 1, "P2": 2}
    docs = await db.actions.find({"user_id": user["_id"]}).to_list(500)
    docs = [_clean(d) for d in docs]
    docs.sort(key=lambda x: order.get(x.get("priority"), 9))
    return docs


@api.patch("/actions/{aid}")
async def update_action(aid: str, body: ActionStatusBody, user: dict = Depends(current_user)):
    res = await db.actions.update_one({"id": aid, "user_id": user["_id"]},
                                      {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Action not found")
    updated = await db.actions.find_one({"id": aid, "user_id": user["_id"]})
    return _clean(updated)


# ---------------- Demo control ----------------
@api.post("/demo/load")
async def load_demo(user: dict = Depends(current_user)):
    uid = user["_id"]
    if not await db.our_product.find_one({"user_id": uid, "is_demo": True}):
        await _seed_user_demo(uid)
    else:
        existing = await db.competitors.count_documents({"user_id": uid, "is_demo": True})
        if existing == 0:
            for c in demo_data.DEMO_COMPETITORS:
                comp = demo_data.build_demo_competitor(uid, c)
                await db.competitors.insert_one(comp)
                for h in demo_data.build_demo_history(uid, comp):
                    await db.competitor_history.insert_one(h)
    return {"ok": True}


@api.delete("/demo/clear")
async def clear_demo(user: dict = Depends(current_user)):
    uid = user["_id"]
    demo_ids = [c["id"] for c in await db.competitors.find(
        {"user_id": uid, "is_demo": True}, {"id": 1}).to_list(500)]
    await db.competitors.delete_many({"user_id": uid, "is_demo": True})
    await db.our_product.delete_many({"user_id": uid, "is_demo": True})
    if demo_ids:
        await db.competitor_history.delete_many({"user_id": uid, "competitor_id": {"$in": demo_ids}})
    return {"ok": True}


@api.get("/")
async def root():
    return {"status": "ok", "service": "AI Competitor Intelligence"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_origin_regex=r"https://.*\.emergentagent\.com|http://localhost:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.competitors.create_index("user_id")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        res = await db.users.insert_one({
            "email": admin_email, "password_hash": auth_utils.hash_password(admin_password),
            "name": "Admin", "role": "admin", "onboarding_completed": False,
            "has_real_product": False, "created_at": datetime.now(timezone.utc)})
        await _seed_user_demo(str(res.inserted_id))
    elif not auth_utils.verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": auth_utils.hash_password(admin_password)}})
    logger.info("Startup complete")
