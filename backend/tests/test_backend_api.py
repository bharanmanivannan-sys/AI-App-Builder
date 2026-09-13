"""Backend API tests for AI Competitor Intelligence app."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://insight-edge-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["token"]
    return data["token"]


@pytest.fixture(scope="session")
def admin_client(admin_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"})
    return s


@pytest.fixture(scope="session")
def new_user():
    """Register a fresh user to verify demo seeding + baseline flow."""
    email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Passw0rd!", "name": "Test User"}, timeout=30)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {data['token']}"})
    return {"email": email, "token": data["token"], "session": s, "cookies": r.cookies}


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_login_sets_cookies(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        # cookie should be set
        cookie_names = list(r.cookies.keys())
        assert any("token" in c.lower() or "access" in c.lower() or "ci_" in c.lower() for c in cookie_names), f"cookies={cookie_names}"

    def test_me_with_bearer(self, admin_client):
        r = admin_client.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_me_with_cookie_only(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        # remove token so only cookie is used
        r2 = s.get(f"{API}/auth/me", timeout=15)
        assert r2.status_code == 200, f"cookie auth failed: {r2.status_code} {r2.text}"
        assert r2.json().get("email") == ADMIN_EMAIL

    def test_dashboard_unauth_401(self):
        r = requests.get(f"{API}/dashboard", timeout=15)
        assert r.status_code in (401, 403)

    def test_register_new_user_seeded(self, new_user):
        r = new_user["session"].get(f"{API}/dashboard", timeout=15)
        assert r.status_code == 200
        data = r.json()
        # new user should have demo baseline + demo competitors
        comps = data.get("competitors") or []
        assert len(comps) >= 1, f"expected demo competitors seeded, got {len(comps)}"


# ---------- Dashboard ----------
class TestDashboard:
    def test_admin_dashboard(self, admin_client):
        r = admin_client.get(f"{API}/dashboard", timeout=15)
        assert r.status_code == 200
        data = r.json()
        # baseline exists
        assert data.get("our_product") or data.get("baseline"), f"no baseline: keys={list(data.keys())}"
        comps = data.get("competitors") or []
        assert len(comps) >= 1


# ---------- Competitors: add + analyze ----------
class TestCompetitorFlow:
    def test_add_and_analyze_competitor(self, admin_client):
        payload = {"company_name": "TEST_Example", "industry": "SaaS", "website": "https://example.com"}
        r = admin_client.post(f"{API}/competitors", json=payload, timeout=30)
        assert r.status_code in (200, 201), f"create failed: {r.status_code} {r.text}"
        comp = r.json()
        cid = comp.get("id") or comp.get("_id")
        assert cid
        # analyze
        r2 = admin_client.post(f"{API}/competitors/{cid}/analyze", timeout=180)
        assert r2.status_code == 200, f"analyze failed: {r2.status_code} {r2.text[:400]}"
        analyzed = r2.json()
        # after analyze, either status=analyzed or scores present
        assert (analyzed.get("status") == "analyzed") or analyzed.get("analysis") or analyzed.get("scores"), f"no analysis: {list(analyzed.keys())}"
        # cleanup
        admin_client.delete(f"{API}/competitors/{cid}", timeout=15)


# ---------- Our Product analyze ----------
class TestOurProduct:
    def test_analyze_our_product(self, new_user):
        s = new_user["session"]
        payload = {"company_name": "TEST_MyCo", "industry": "SaaS", "website": "https://example.com", "product_name": "TEST_Product"}
        r = s.post(f"{API}/our-product/analyze", json=payload, timeout=180)
        assert r.status_code == 200, f"our-product analyze failed: {r.status_code} {r.text[:400]}"
        # After analyze, has_real_product should be True and demo hidden by default
        me = s.get(f"{API}/auth/me", timeout=15).json()
        assert me.get("has_real_product") is True


# ---------- Insights ----------
class TestInsights:
    def test_generate_and_fetch_insights(self, admin_client):
        r = admin_client.post(f"{API}/insights/generate", timeout=180)
        assert r.status_code == 200, f"insights generate failed: {r.status_code} {r.text[:400]}"
        data = r.json()
        assert "executive_summary" in data or "swot" in data or "insights" in data, f"missing keys: {list(data.keys())}"
        # SWOT quadrants
        swot = data.get("swot") or {}
        if swot:
            for q in ["strengths", "weaknesses", "opportunities", "threats"]:
                assert q in swot, f"missing swot quadrant: {q}"
        # Cached fetch
        r2 = admin_client.get(f"{API}/insights", timeout=30)
        assert r2.status_code == 200

    def test_actions_list_and_update(self, admin_client):
        r = admin_client.get(f"{API}/actions", timeout=15)
        assert r.status_code == 200
        actions = r.json()
        if isinstance(actions, dict):
            actions = actions.get("actions", [])
        if actions:
            aid = actions[0].get("id") or actions[0].get("_id")
            r2 = admin_client.patch(f"{API}/actions/{aid}", json={"status": "In Progress"}, timeout=15)
            assert r2.status_code == 200
            assert (r2.json().get("status") == "In Progress")


# ---------- Demo ----------
class TestDemo:
    def test_demo_clear_then_load(self, new_user):
        s = new_user["session"]
        r = s.delete(f"{API}/demo/clear", timeout=30)
        assert r.status_code in (200, 204)
        r2 = s.post(f"{API}/demo/load", timeout=60)
        assert r2.status_code in (200, 201)
