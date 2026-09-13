# Test Credentials — AI Competitor Intelligence

## Admin / Demo account (seeded on startup, pre-loaded with demo data + generated insights)
- Email: `admin@example.com`
- Password: `admin123`
- Role: admin

Any newly registered user is auto-seeded with the DEMO dataset (a demo "Our Product" baseline + 7 demo competitors across SaaS / EV / Consumer Electronics), clearly labeled "Demo Data" and auto-hidden once the user adds their own real product or competitors.

## Auth
- JWT email/password. Token returned in login/register response body AND set as httpOnly cookies (SameSite=Lax).
- Frontend stores the token in localStorage (`ci_token`) and sends it as `Authorization: Bearer <token>` (fallback to cookie).

## Auth endpoints (prefix /api)
- POST /api/auth/register  {email, password, name}
- POST /api/auth/login     {email, password}
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/forgot-password  {email}   (reset link logged to backend console)
- POST /api/auth/reset-password   {token, password}

## Key app endpoints (all require auth)
- GET/PUT  /api/our-product
- POST      /api/our-product/analyze      {company_name, industry, website, product_name?}  (live scrape + GPT-5.4)
- GET/POST  /api/competitors
- POST      /api/competitors/{id}/analyze
- GET       /api/competitors/{id}
- DELETE    /api/competitors/{id}
- GET       /api/dashboard        (baseline + analyzed competitors + scoring weights)
- GET/POST  /api/insights[/generate]  (GPT-5.4 executive summary, SWOT, insights, recommended actions)
- GET       /api/actions ; PATCH /api/actions/{id} {status}
- POST      /api/demo/load ; DELETE /api/demo/clear
