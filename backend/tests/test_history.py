"""Backend tests for the new Analysis History feature."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "admin@example.com", "password": "admin123"}, timeout=30)
    assert r.status_code == 200, r.text
    tok = r.json().get("token") or r.json().get("access_token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def demo_slack_id(client):
    r = client.get(f"{BASE_URL}/api/competitors", timeout=30)
    assert r.status_code == 200
    comps = r.json()
    slack = next((c for c in comps if c.get("company_name") == "Slack"), None)
    assert slack, "Slack demo competitor not found"
    return slack["id"]


def test_history_returns_chronological_list(client, demo_slack_id):
    r = client.get(f"{BASE_URL}/api/competitors/{demo_slack_id}/history", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 5, f"Expected 5 seeded snapshots, got {len(data)}"
    # chronological (oldest -> newest)
    dates = [d["analyzed_at"] for d in data]
    assert dates == sorted(dates), "History must be oldest -> newest"
    # required fields
    for snap in data:
        for k in ("date", "overall", "scores", "starting_price", "confidence", "feature_count"):
            assert k in snap, f"missing key {k}"
        assert isinstance(snap["scores"], dict) and len(snap["scores"]) > 0
    # upward trend on overall
    overalls = [d["overall"] for d in data]
    assert overalls[-1] >= overalls[0], f"Expected upward trend, got {overalls}"


def test_reanalyze_appends_snapshot(client, demo_slack_id):
    before = client.get(f"{BASE_URL}/api/competitors/{demo_slack_id}/history", timeout=30).json()
    r = client.post(f"{BASE_URL}/api/competitors/{demo_slack_id}/analyze", timeout=180)
    # Analyze may occasionally 502 due to live scrape; treat 502 as skip
    if r.status_code == 502:
        pytest.skip(f"Live analyze unavailable: {r.text[:120]}")
    assert r.status_code == 200, r.text
    after = client.get(f"{BASE_URL}/api/competitors/{demo_slack_id}/history", timeout=30).json()
    assert len(after) == len(before) + 1, f"Expected +1 snapshot, before={len(before)} after={len(after)}"


def test_delete_removes_history(client):
    # Create a fresh competitor, seed a history row via analyze OR by direct approach, then delete
    payload = {"company_name": "TEST_HistDel", "industry": "SaaS",
               "website": "https://example.com", "product_name": "X"}
    r = client.post(f"{BASE_URL}/api/competitors", json=payload, timeout=30)
    assert r.status_code in (200, 201), r.text
    cid = r.json()["id"]
    # try to seed history (best-effort)
    client.post(f"{BASE_URL}/api/competitors/{cid}/analyze", timeout=180)
    # delete
    d = client.delete(f"{BASE_URL}/api/competitors/{cid}", timeout=30)
    assert d.status_code == 200
    # history GET should now 404 (competitor gone)
    h = client.get(f"{BASE_URL}/api/competitors/{cid}/history", timeout=30)
    assert h.status_code == 404
