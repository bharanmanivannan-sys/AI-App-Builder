# AI Competitor & Product Analysis Dashboard — PRD

## Problem statement
A competitive-intelligence SaaS MVP: log in, add competitors (company/industry/website), analyze their public websites live, and produce an executive-friendly dashboard following DATA → COMPARISON → INSIGHT → ACTION. Core value: "Don't just show me competitor data. Tell me what it means and what I should do next."

## User choices (locked)
- AI model: **GPT-5.4** via Emergent Universal LLM key (`emergentintegrations`).
- Auth: **email + password (JWT)**; token also returned in body + httpOnly cookie (SameSite=Lax); frontend uses Bearer token from localStorage `ci_token`.
- Website analysis: **live HTML fetch (httpx+BeautifulSoup) + GPT-5.4 extraction** (no fabrication; "Not publicly available" fallback).
- Baseline "Our Product" = **the first product the user analyzes/adds** (their own site). A demo baseline is pre-filled until then.
- **Demo data pre-loaded** (SaaS/EV/Consumer Electronics), labeled "Demo Data", auto-hidden once user adds real data; manual toggle + Load/Clear in Settings.
- **PDF export** client-side (html2canvas + jsPDF).
- **Guided onboarding**: prompt to analyze own site first, then add competitors.

## Architecture
- Backend: FastAPI (`/app/backend`): server.py (routes), auth.py (JWT/bcrypt/cookies+Bearer), analysis.py (scrape+GPT prompts+weighted scoring), llm_service.py (LlmChat gpt-5.4, fetch_website_text), demo_data.py. MongoDB (motor): users, competitors, our_product, insights, actions, login_attempts, password_reset_tokens.
- Frontend: React 18 + react-router + Tailwind (dark "Executive Command Center" theme) + Recharts + lucide-react + sonner. Context: AuthContext, DataContext. Pages: Login, Dashboard, Competitors, Compare, Insights, Swot, Settings.
- Scoring: Overall = Price×0.20 + Features×0.25 + Value×0.20 + Market×0.20 + Innovation×0.15 (server-side). Sub-scores are AI-derived, clearly labeled.

## Implemented (2026-06-13)
- Auth: register/login/logout/me/refresh/forgot/reset; brute-force lockout; admin seed (admin@example.com/admin123).
- Competitors CRUD + live analyze; Our Product analyze/edit; dashboard aggregate; insights generate (exec summary, SWOT, insights, recommended actions); actions status; demo load/clear.
- Full dashboard UI: 6 score cards, AI executive summary, pricing comparison (table+bar), feature matrix (available/not/unknown + category filter + feature-strength scores), radar chart, interactive positioning scatter (changeable X/Y), sortable comparison table, SWOT quadrants, AI insight cards, recommended actions with status dropdowns, one-click PDF export, guided onboarding banner, demo toggle, data-source/confidence badges.
- Verified by testing agent: backend 92% (only a non-bug assertion), frontend 100%, no input-wipe/reload issue.

## Known minor / backlog
- Positioning scatter labels can overlap when competitors cluster (P2 — add tooltips/spacing).
- P1 (deferred): Export to Excel, competitor history, saved comparison views, custom scoring weights.
- P2 (deferred): automated monitoring, email alerts, news/social/review analysis, market-share, forecasting, team/RBAC.

## Notes
- App URL: https://insight-edge-6.preview.emergentagent.com (REACT_APP_BACKEND_URL, same origin for /api).
- Backend tests: `pytest /app/backend/tests/test_backend_api.py -v`.
