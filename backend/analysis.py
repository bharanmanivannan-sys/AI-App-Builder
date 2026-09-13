from llm_service import llm_json, fetch_website_text

SCORE_WEIGHTS = {
    "price_competitiveness": 0.20,
    "feature_strength": 0.25,
    "value_proposition": 0.20,
    "market_position": 0.20,
    "innovation": 0.15,
}


def compute_overall(scores: dict) -> int:
    total = 0.0
    for key, weight in SCORE_WEIGHTS.items():
        total += float(scores.get(key, 0) or 0) * weight
    return round(total)


ANALYSIS_SYSTEM = (
    "You are a competitive-intelligence analyst. You extract ONLY publicly available, "
    "evidence-based information from the provided website content. NEVER fabricate data. "
    "If a data point cannot be found in the content, use the exact string 'Not publicly available'. "
    "You always respond with a single valid JSON object and nothing else."
)


def build_analysis_prompt(company_name, industry, website, page):
    return f"""Analyse the following company using ONLY the website content provided below.

Company: {company_name}
Industry: {industry}
Website: {website}

--- WEBSITE CONTENT START ---
Title: {page.get('title')}
Meta: {page.get('meta_description')}
Body: {page.get('text')}
--- WEBSITE CONTENT END ---

Return a JSON object with EXACTLY this structure:
{{
  "description": "1-2 sentence company/product description from the content",
  "products_services": ["list of key products or services found"],
  "target_customers": "who they target, or 'Not publicly available'",
  "value_propositions": ["key value propositions / positioning statements"],
  "pricing": {{
    "starting_price": "e.g. '$99/mo' or 'Not publicly available'",
    "tiers": [{{"name": "tier name", "price": "price or 'Not publicly available'"}}],
    "notes": "short note on pricing model, or 'Not publicly available'",
    "confidence": "High | Medium | Low"
  }},
  "features": [{{"name": "normalized feature name", "category": "one of: Core, Integrations, Analytics, Support, Security, Experience", "available": true}}],
  "scores": {{
    "price_competitiveness": 0-100,
    "feature_strength": 0-100,
    "value_proposition": 0-100,
    "market_position": 0-100,
    "innovation": 0-100
  }},
  "confidence": "High | Medium | Low",
  "key_strength": "one concise sentence on their biggest strength",
  "key_weakness": "one concise sentence on their biggest apparent weakness"
}}

Rules:
- Scores are your AI-derived competitive estimates (0-100), NOT objective facts.
- Only include features you can reasonably infer from the content. Normalize names so they compare across companies.
- Keep lists concise (max 8 features, max 5 value propositions)."""


INSIGHTS_SYSTEM = (
    "You are a senior competitive-strategy advisor for an executive team. "
    "You reason ONLY from the structured competitive data provided. Every insight must be specific, "
    "evidence-based, actionable and concise. Reference the underlying data (features, scores, pricing). "
    "Avoid generic advice like 'improve marketing' unless the data supports it. "
    "Respond with a single valid JSON object and nothing else."
)


def build_insights_prompt(baseline, competitors):
    import json
    payload = {
        "our_product": {
            "name": baseline.get("label"),
            "scores": baseline.get("scores"),
            "overall": baseline.get("overall"),
            "pricing": baseline.get("pricing"),
            "features": [f.get("name") for f in baseline.get("features", [])],
            "value_propositions": baseline.get("value_propositions"),
        },
        "competitors": [
            {
                "name": c.get("company_name"),
                "scores": c.get("scores"),
                "overall": c.get("overall"),
                "pricing": c.get("pricing"),
                "features": [f.get("name") for f in c.get("features", [])],
                "key_strength": c.get("key_strength"),
                "key_weakness": c.get("key_weakness"),
            }
            for c in competitors
        ],
    }
    return f"""Here is the competitive dataset. "our_product" is the baseline we are analysing FOR.

{json.dumps(payload, indent=2)}

Produce a JSON object with EXACTLY this structure:
{{
  "executive_summary": {{
    "competitive_position": "Strong | Moderate | Weak",
    "biggest_advantage": "one sentence",
    "biggest_weakness": "one sentence",
    "biggest_threat": "name the competitor + why, one sentence",
    "biggest_opportunity": "one sentence",
    "narrative": "2-3 sentence executive-friendly summary"
  }},
  "swot": {{
    "strengths": ["evidence-backed strengths of our_product"],
    "weaknesses": ["areas where competitors outperform us, cite specifics"],
    "opportunities": ["market/product opportunities with rationale"],
    "threats": ["competitive risks, name competitors"]
  }},
  "insights": {{
    "where_we_are_weaker": [{{"issue": "", "evidence": "", "impact": ""}}],
    "where_competitors_are_better": [{{"competitor": "", "advantage": "", "evidence": "", "impact": ""}}],
    "opportunities": [{{"opportunity": "", "why": "", "evidence": "", "impact": "High | Medium | Low", "priority": "P0 | P1 | P2"}}]
  }},
  "recommended_actions": [{{"priority": "P0 | P1 | P2", "action": "", "reason": "", "impact": "High | Medium | Low"}}]
}}

Keep each list to 3-5 high-signal items. Every item must reference concrete evidence from the dataset."""


async def analyze_website(company_name, industry, website):
    page = await fetch_website_text(website)
    prompt = build_analysis_prompt(company_name, industry, website, page)
    data = await llm_json(ANALYSIS_SYSTEM, prompt, session_id=f"analyze-{website}")
    scores = data.get("scores", {})
    data["overall"] = compute_overall(scores)
    data["source_url"] = page.get("url")
    return data
