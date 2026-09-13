"""Pre-filled DEMO dataset (clearly labeled). No live scraping needed to demo."""

import uuid
from datetime import datetime, timezone

_NOW = "2026-06-01"


def _feat(names, category="Core"):
    return [{"name": n, "category": category, "available": True} for n in names]


DEMO_OUR_PRODUCT = {
    "label": "Zephyr Collab (Demo)",
    "is_demo": True,
    "company": {
        "name": "Zephyr Inc.",
        "industry": "SaaS",
        "website": "https://zephyr.example.com",
        "description": "Team collaboration and messaging platform for modern companies.",
    },
    "product": {
        "name": "Zephyr Collab (Demo)",
        "url": "https://zephyr.example.com",
        "category": "Team Collaboration",
        "description": "Channels, huddles and workflow automation for distributed teams.",
        "target_customers": "SMBs and mid-market product & engineering teams",
        "value_proposition": "Faster team communication with built-in automation",
        "differentiators": "Native workflow builder, generous free tier",
        "use_cases": "Team chat, async standups, incident coordination",
        "competitive_goals": "Win against incumbents on price and automation depth",
    },
    "value_propositions": ["Fast team communication", "Built-in workflow automation", "Generous free tier"],
    "pricing": {"starting_price": "$8/user/mo", "tiers": [
        {"name": "Free", "price": "$0"}, {"name": "Pro", "price": "$8/user/mo"},
        {"name": "Business", "price": "$15/user/mo"}], "notes": "Per-seat SaaS pricing", "confidence": "High"},
    "features": _feat(["Channels", "Huddles / Voice", "Workflow Automation", "File Sharing", "Search"]) +
                _feat(["Slack Import", "Google Drive"], "Integrations") +
                _feat(["Usage Analytics"], "Analytics"),
    "scores": {"price_competitiveness": 82, "feature_strength": 74, "value_proposition": 78,
               "market_position": 62, "innovation": 76},
    "overall": 74,
    "confidence": "High",
    "key_strength": "Strong price-to-automation ratio",
    "key_weakness": "Smaller market presence than incumbents",
}


DEMO_COMPETITORS = [
    # SaaS
    {
        "company_name": "Slack", "industry": "SaaS", "website": "https://slack.com",
        "product_name": "Slack", "product_category": "Team Collaboration",
        "target_market": "Enterprises & teams of all sizes", "notes": "",
        "value_propositions": ["Best-in-class integrations", "Reliable enterprise messaging"],
        "pricing": {"starting_price": "$8.75/user/mo", "tiers": [
            {"name": "Free", "price": "$0"}, {"name": "Pro", "price": "$8.75/user/mo"},
            {"name": "Business+", "price": "$15/user/mo"}], "notes": "Per-seat", "confidence": "High"},
        "features": _feat(["Channels", "Huddles / Voice", "File Sharing", "Search", "Canvas"]) +
                    _feat(["2000+ App Integrations", "Google Drive", "Zoom"], "Integrations") +
                    _feat(["Analytics Dashboard"], "Analytics") + _feat(["Enterprise Key Mgmt"], "Security"),
        "scores": {"price_competitiveness": 66, "feature_strength": 90, "value_proposition": 84,
                   "market_position": 92, "innovation": 82},
        "key_strength": "Unmatched integration ecosystem", "key_weakness": "Higher effective cost at scale",
        "confidence": "High",
    },
    {
        "company_name": "Microsoft Teams", "industry": "SaaS", "website": "https://www.microsoft.com/microsoft-teams",
        "product_name": "Microsoft Teams", "product_category": "Team Collaboration",
        "target_market": "Enterprises on Microsoft 365", "notes": "",
        "value_propositions": ["Bundled with Microsoft 365", "Deep Office integration"],
        "pricing": {"starting_price": "$4/user/mo", "tiers": [
            {"name": "Free", "price": "$0"}, {"name": "Essentials", "price": "$4/user/mo"},
            {"name": "M365 Business", "price": "$6/user/mo"}], "notes": "Often bundled", "confidence": "Medium"},
        "features": _feat(["Channels", "Huddles / Voice", "Video Meetings", "File Sharing"]) +
                    _feat(["Office 365", "SharePoint", "Outlook"], "Integrations") +
                    _feat(["Compliance Center"], "Security"),
        "scores": {"price_competitiveness": 88, "feature_strength": 80, "value_proposition": 82,
                   "market_position": 90, "innovation": 70},
        "key_strength": "Cost advantage via M365 bundling", "key_weakness": "Heavier, less focused UX",
        "confidence": "Medium",
    },
    {
        "company_name": "Zoom", "industry": "SaaS", "website": "https://zoom.us",
        "product_name": "Zoom Team Chat", "product_category": "Team Collaboration",
        "target_market": "Meeting-first organizations", "notes": "",
        "value_propositions": ["Best video experience", "Simple and reliable"],
        "pricing": {"starting_price": "$13.33/user/mo", "tiers": [
            {"name": "Basic", "price": "$0"}, {"name": "Pro", "price": "$13.33/user/mo"}],
            "notes": "Per-seat", "confidence": "High"},
        "features": _feat(["Video Meetings", "Team Chat", "Huddles / Voice", "Whiteboard"]) +
                    _feat(["Calendar", "Slack"], "Integrations") + _feat(["AI Companion"], "Analytics"),
        "scores": {"price_competitiveness": 58, "feature_strength": 72, "value_proposition": 76,
                   "market_position": 80, "innovation": 78},
        "key_strength": "Superior video meeting quality", "key_weakness": "Chat is secondary to video",
        "confidence": "High",
    },
    # EV
    {
        "company_name": "Ather Energy", "industry": "Electric Vehicles", "website": "https://www.atherenergy.com",
        "product_name": "Ather 450X", "product_category": "Electric Scooter",
        "target_market": "Urban premium commuters (India)", "notes": "",
        "value_propositions": ["Premium performance", "Smart connected dashboard"],
        "pricing": {"starting_price": "₹1,29,999", "tiers": [{"name": "450S", "price": "₹1,29,999"},
            {"name": "450X", "price": "₹1,46,999"}], "notes": "Ex-showroom", "confidence": "Medium"},
        "features": _feat(["Fast Charging", "Connected Dashboard", "OTA Updates", "Ride Modes"]) +
                    _feat(["Mobile App"], "Integrations") + _feat(["Ather Grid Network"], "Support"),
        "scores": {"price_competitiveness": 60, "feature_strength": 86, "value_proposition": 80,
                   "market_position": 74, "innovation": 88},
        "key_strength": "Best-in-class tech and performance", "key_weakness": "Premium pricing limits reach",
        "confidence": "Medium",
    },
    {
        "company_name": "Ola Electric", "industry": "Electric Vehicles", "website": "https://www.olaelectric.com",
        "product_name": "Ola S1 Pro", "product_category": "Electric Scooter",
        "target_market": "Mass-market EV buyers (India)", "notes": "",
        "value_propositions": ["Aggressive pricing", "Long range"],
        "pricing": {"starting_price": "₹99,999", "tiers": [{"name": "S1 Air", "price": "₹99,999"},
            {"name": "S1 Pro", "price": "₹1,29,999"}], "notes": "Ex-showroom", "confidence": "Medium"},
        "features": _feat(["Long Range", "Fast Charging", "Ride Modes", "OTA Updates"]) +
                    _feat(["Mobile App"], "Integrations"),
        "scores": {"price_competitiveness": 90, "feature_strength": 78, "value_proposition": 82,
                   "market_position": 82, "innovation": 80},
        "key_strength": "Strong price and range", "key_weakness": "Service and quality perception",
        "confidence": "Medium",
    },
    # Consumer Electronics
    {
        "company_name": "Apple", "industry": "Consumer Electronics", "website": "https://www.apple.com",
        "product_name": "iPhone", "product_category": "Smartphone",
        "target_market": "Premium global consumers", "notes": "",
        "value_propositions": ["Ecosystem integration", "Premium brand & build"],
        "pricing": {"starting_price": "$799", "tiers": [{"name": "iPhone", "price": "$799"},
            {"name": "iPhone Pro", "price": "$999"}], "notes": "MSRP", "confidence": "High"},
        "features": _feat(["Flagship Camera", "Custom Silicon", "Premium Display"]) +
                    _feat(["iCloud", "AirDrop", "Apple Ecosystem"], "Integrations") +
                    _feat(["On-device AI"], "Analytics"),
        "scores": {"price_competitiveness": 50, "feature_strength": 92, "value_proposition": 88,
                   "market_position": 95, "innovation": 90},
        "key_strength": "Dominant premium ecosystem", "key_weakness": "High price point",
        "confidence": "High",
    },
    {
        "company_name": "Samsung", "industry": "Consumer Electronics", "website": "https://www.samsung.com",
        "product_name": "Galaxy S", "product_category": "Smartphone",
        "target_market": "Broad global consumers", "notes": "",
        "value_propositions": ["Wide product range", "Display leadership"],
        "pricing": {"starting_price": "$699", "tiers": [{"name": "Galaxy S", "price": "$699"},
            {"name": "Galaxy S Ultra", "price": "$1199"}], "notes": "MSRP", "confidence": "High"},
        "features": _feat(["Flagship Camera", "Premium Display", "Fast Charging"]) +
                    _feat(["Google Ecosystem", "SmartThings"], "Integrations") +
                    _feat(["Galaxy AI"], "Analytics"),
        "scores": {"price_competitiveness": 64, "feature_strength": 88, "value_proposition": 82,
                   "market_position": 90, "innovation": 84},
        "key_strength": "Broadest premium-to-budget lineup", "key_weakness": "Software update longevity",
        "confidence": "High",
    },
]


def build_demo_competitor(user_id, c):
    now = datetime.now(timezone.utc).isoformat()
    data = {k: c[k] for k in ("description", "target_market") if k in c}
    return {
        "user_id": user_id,
        "id": str(uuid.uuid4()),
        "is_demo": True,
        "company_name": c["company_name"],
        "industry": c["industry"],
        "website": c["website"],
        "product_name": c.get("product_name"),
        "product_category": c.get("product_category"),
        "target_market": c.get("target_market"),
        "notes": c.get("notes", ""),
        "status": "analyzed",
        "last_analyzed": _NOW,
        "created_at": now,
        "analysis": {
            "description": c.get("description", f"{c['company_name']} — demo profile."),
            "products_services": [c.get("product_name")],
            "target_customers": c.get("target_market"),
            "value_propositions": c.get("value_propositions", []),
            "pricing": c["pricing"],
            "features": c["features"],
            "scores": c["scores"],
            "overall": _overall(c["scores"]),
            "confidence": c.get("confidence", "Medium"),
            "key_strength": c.get("key_strength"),
            "key_weakness": c.get("key_weakness"),
            "source_url": c["website"],
        },
    }


def _overall(scores):
    from analysis import compute_overall
    return compute_overall(scores)
