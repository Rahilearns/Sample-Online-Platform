# Loan Gateway — Business Requirements Document (Lean)

**Document version:** 1.0
**Date:** May 2026
**Prepared by:** [Customer]
**For:** [Web development vendor]
**Status:** Issued for fixed-price quotation

---

## 1. Project Summary & Canonical References

[Customer] is engaging [Vendor] to build a production-ready online loan application gateway for a Bangladesh-based Non-Banking Financial Institution. A complete working prototype already exists, and **the prototype is the canonical visual and behavioural specification of this engagement.**

All visual design, interaction patterns, microcopy, colour palette, typography, bilingual translations (English + বাংলা), modal flows, calculator logic, eligibility computation, multi-stage forms, validation rules, and tracking-number format are finalised in the prototype. **No design phase, wireframing, or UX-discovery work is required.** [Vendor] is asked to engineer a production version aligned with the prototype.

| Reference | Location |
|---|---|
| Live prototype | https://rahilearns.github.io/Sample-Online-Platform/ |
| Source code repository | https://github.com/Rahilearns/Sample-Online-Platform |
| Branding placeholder | The prototype uses "IDLC" as a placeholder brand. Production copy and branding will be supplied by [Customer]. |
| Sample content disclosure | Every page in the prototype carries a "Sample content for prototype" note on the policy sections. These are placeholders. Production policy text will be supplied by [Customer] before launch. |

The vendor may review, fork, and adapt any portion of the front-end code (HTML/CSS/JavaScript) at no licence cost.

---

## 2. Scope

### 2.1 In scope — Phase 1 MVP (fixed price)

**Pages (11 total, no additional pages):**

1. `index.html` — Marketing home (nav, hero, stats, news, why-us, quick links, footer; floating Customer Login + Apply for Loan buttons)
2. `apply.html` — Choose Individual / Business
3. `apply-individual.html` — Choose Home / Car / Personal Loan with modal pre-filter
4. `apply-business.html` — SME (with modal) / Corporate (external link)
5. `apply-home-loan.html` — Home Loan product page + OTP-gated application form + EMI calculator
6. `apply-car-loan.html` — same shape, Car Loan content
7. `apply-personal-loan.html` — same shape, Personal Loan content
8. `apply-sme-loan.html` — same shape, SME Loan content
9. Admin dashboard — list submitted applications, search by tracking number, view detail, export CSV
10. Admin login page
11. 404 / generic error page

**Stubbed backend integrations for Phase 1:**

- **OTP**: hardcoded value `1234` (no real SMS sent)
- **NID lookup**: hardcoded — NID `5102284394` returns an existing client (Name=Mahfuzul Islam, CIF=553577, Email=Imahfuzul@gmail.com). All other NIDs treated as new client.
- **Application submission**: persisted to MySQL or PostgreSQL; tracking number returned per the format `IDLC-YYMMDD-XXXX`
- **Eligibility check**: server-side mirror of the client-side calculation in the prototype (interest rate 13.00% p.a., 70%-of-income load threshold, BDT 25 lakh minimum reduced amount)

**Languages:** English + বাংলা. All ~250 translation strings are provided in `translations.js`. No additional translation work is required.

### 2.2 Out of scope — Phase 1

- Real SMS gateway integration → **Phase 2**
- Real CIF / NID lookup against [Customer]'s core banking system → **Phase 2**
- Document upload, OCR, e-signature, branch verification → **Phase 3**
- Customer Login flow (currently inert in the prototype) → **Phase 3**
- Push notifications, email automation → **Phase 3**
- Mobile native apps → **out of scope entirely**
- Branding refresh (logo, colours, content) — handled by [Customer]'s in-house team

---

## 3. Sitemap & User Flows

### 3.1 Sitemap

```
index.html  (marketing home)
└── floating "Apply for Loan"
    └── apply.html  (Loan for Individuals | Loan for Businesses)
        ├── apply-individual.html
        │   └── modal: Purpose of Loan × Financing Mode →
        │       ├── apply-home-loan.html
        │       ├── apply-car-loan.html
        │       └── apply-personal-loan.html
        └── apply-business.html
            ├── modal: Desired Product × Financing Mode → apply-sme-loan.html
            └── external link → https://idlc.com/corporate-loan (new tab)
```

### 3.2 Critical user flow — individual loan application

1. Land on home → click floating "Apply for Loan" (bottom-right, sticky)
2. See 2 options (Individual / Business) → click Individual
3. See 3 sub-options → click (e.g.) Home Loan
4. Pop-up modal: pick Purpose + Financing Mode → click Proceed
5. Land on product page → enter Name, NID, DOB (Day/Month/Year dropdowns), Phone → click Request OTP
6. 4 OTP boxes appear → enter `1234` (stub) → click Submit OTP
7. Page scrolls to top of application-form card
8. If NID matches existing-client stub → Name, CIF, Email auto-fill silently
9. Fill remaining fields + answer "Loan Burden?" Yes/No (conditional Monthly Loan Burden) + tick 2 declarations → click Submit Application
10. Eligibility check runs (see §4.1):
    - `eligible` → green success + tracking number
    - `reduced` (eligible amount ≥ BDT 25 lakh) → green success + tracking number; message uses reduced wording
    - `ineligible` → amber warning, no tracking number issued

### 3.3 SME flow

Identical shape to §3.2 but launched from `apply-business.html` → SME card → modal dropdowns are Product (3 options) + Mode (2 options) → land on `apply-sme-loan.html`.

### 3.4 Corporate flow

Click "Loan for Corporates" on `apply-business.html` → browser opens `https://idlc.com/corporate-loan` in a new tab. No internal page.

---

## 4. Business Rules

### 4.1 Eligibility calculation

| Parameter | Value |
|---|---|
| Standard interest rate (eligibility math) | **13.00% per annum** |
| EMI formula | P × r × (1+r)^n / ((1+r)^n − 1) where r = 13/12/100 and n = years × 12 |
| Eligibility threshold | Total monthly load ≤ **70% of declared monthly income** |
| Total monthly load | Projected EMI + existing monthly loan burden (if Yes selected) |
| Reduced-amount minimum | **BDT 25,00,000** (25 lakh) — below this, application is rejected |
| Currency | BDT throughout |

**Decision matrix:**

| Condition | Status | Confirmation message wording | Tracking issued? |
|---|---|---|---|
| Total load at requested amount ≤ 70% of income | `eligible` | "…the **requested loan amount** of BDT [requested]…" | Yes |
| Total load at requested amount > 70%, but max-eligible at same tenor ≥ BDT 25 lakh | `reduced` | "…**a loan amount of** BDT [reduced]…" | Yes |
| Existing burden alone > 70% of income, OR max-eligible < BDT 25 lakh | `ineligible` | "Your monthly income will not cover your loan burden and IDLC's risk appetite…" | No |

### 4.2 OTP

- Phase 1: hardcoded `1234`
- Phase 2: integrate with a Bangladesh-licensed SMS gateway (vendor to recommend; common options: SSLWireless, SMS Express, Robi Axiata corporate SMS)
- OTP expiry: 5 minutes
- Max retry attempts: 3 per phone per hour
- Rate limit on OTP requests: max 5 per phone per hour

### 4.3 Existing-client (NID) lookup

- Phase 1: hardcoded mapping — only NID `5102284394` returns an existing client
- Phase 2: integrate with [Customer]'s core banking / CIB API
- UX behaviour identical in either phase: silent auto-fill of Name + CIF + Email on the application form

### 4.4 Other rules

- Minimum applicant age: **18 years at the date of OTP request**
- NID pattern: 10, 13, or 17 digits (text input, JavaScript-validated)
- Phone pattern: `01XXXXXXXXX` (11 digits, Bangladesh mobile)
- Both declaration checkboxes must be ticked before Submit Application can fire
- Tracking number format: `IDLC-YYMMDD-XXXX` (where XXXX is 4-char alphanumeric, uppercase, excluding 0, O, 1, I, L to avoid visual ambiguity)
- Tracking number generated only for `eligible` and `reduced` outcomes

---

## 5. API Contract

All endpoints return JSON, use bearer-token authentication post-OTP, and emit HTTP 400 (`{field, message}` array) on validation errors and HTTP 5xx (`{error_id}`) on server errors.

| Endpoint | Method | Purpose | Phase 1 behaviour |
|---|---|---|---|
| `/api/otp/request` | POST | Initiate OTP for a phone | Returns `{success: true, expires_in: 300}`. No SMS dispatched. |
| `/api/otp/verify` | POST | Verify entered OTP | Compares against `1234`. Returns `{success: true, token}` or `{success: false}`. |
| `/api/customer/lookup` | GET | NID-based existing-client check | Hardcoded mapping. Returns `{exists: true, name, cif, email}` for `5102284394`, else `{exists: false}`. |
| `/api/applications` | POST | Submit full application | Persists to DB, runs eligibility, returns `{tracking_number, status, eligible_amount}`. |
| `/api/applications/:tracking` | GET | Status lookup (Phase 1: read-only, Phase 3: full status) | Returns current row. |

Request and response schemas to be detailed by vendor in their technical design document, due 1 week after kickoff.

---

## 6. Data Model

```sql
applications
  id (PK, UUID)
  tracking_number (UNIQUE, VARCHAR 20)
  product (ENUM: home-loan, car-loan, personal-loan, sme-loan)
  purpose (VARCHAR 120)
  financing_mode (ENUM: Conventional, Islamic)
  name, nid (indexed), dob (DATE), phone (indexed)
  cif (NULLABLE — only set for existing-client matches)
  email, profession, monthly_income (DECIMAL 15,2)
  has_burden (BOOL), monthly_burden (DECIMAL, NULLABLE)
  expected_amount (DECIMAL), loan_term_years (INT)
  eligibility_status (ENUM: eligible, reduced, ineligible)
  eligible_amount (DECIMAL)
  language (ENUM: en, bn)
  declarations_accepted_at (TIMESTAMP)
  ip_address (VARCHAR 45)
  user_agent (TEXT)
  created_at, updated_at (TIMESTAMP)

audit_log
  id, application_id (FK), event_type, actor, timestamp, payload (JSON)

otp_requests
  id, phone, code_hash, requested_at, expires_at, verified_at (NULLABLE)

admin_users
  id, email (UNIQUE), password_hash, role, created_at, last_login_at
```

Vendor to propose final DDL in technical design document.

---

## 7. Acceptance Criteria

Each AC is demonstrable in under 60 seconds in the staging environment.

| # | Criterion |
|---|---|
| AC-1 | Open `/` → disclaimer ribbon visible at top; brand, lang toggle, hero, stat strip, news cards, why-us band, quick links, footer all render; floating Customer Login + Apply for Loan pinned bottom-right; scrolling does not move them. |
| AC-2 | Click বাং on any page → all visible UI translates → click any internal link → still Bengali → refresh → still Bengali. |
| AC-3 | From `/apply-individual.html` click Home Loan → modal opens with house sketch, blank Purpose dropdown (6 options), blank Financing Mode dropdown (2 options). Pick "Apartment Purchase" + "Conventional Financing" → click Proceed → land on `apply-home-loan.html?purpose=Apartment+Purchase&mode=Conventional`. Title reads "Home Loan \| Conventional Financing". Chip below reads "Apartment Purchase". |
| AC-4 | From `apply-business.html` click Loan for SME → modal opens with storefront sketch, dropdowns Purnota / Working Capital / Long Term Loan × Conventional / Islamic Financing. |
| AC-5 | From `apply-business.html` click Loan for Corporates → new browser tab opens `https://idlc.com/corporate-loan`. |
| AC-6 | On any product page, enter NID `5102284394`, DOB valid date ≥18 yrs, valid BD phone → Request OTP → 4 OTP boxes appear → enter `1234` → Submit OTP → loan form reveals with Name="Mahfuzul Islam", CIF="553577", Email="Imahfuzul@gmail.com" pre-populated. |
| AC-7 | Same flow with any NID other than `5102284394` → after OTP, loan form reveals with Name = whatever was typed in OTP gate, CIF and Email blank. |
| AC-8 | Pick DOB making applicant <18 → click Request OTP → red toast: "Applicants must be at least 18 years of age to submit this loan application." OTP does not fire. |
| AC-9 | DOB Day=31, Month=February, Year=2000 → Day auto-clamps to 29 (leap year). Change Year to 2001 → Day clamps to 28. |
| AC-10 | After OTP, enter Income=200,000; Has Burden=No; Expected Amount=20,00,000; Loan Term=5 → tick both declarations → Submit. Result: green success, message reads "…**requested loan amount** of BDT 20,00,000…", tracking number visible. |
| AC-11 | After OTP, enter Income=1,00,000; Has Burden=No; Expected Amount=5,00,00,000; Loan Term=5 → Submit. Result: green success, message reads "…**a loan amount of** BDT [computed reduced]…", tracking number visible. |
| AC-12 | After OTP, enter Income=30,000; Has Burden=Yes; Monthly Loan Burden=25,000; Expected Amount=25,00,000; Loan Term=5 → Submit. Result: amber warning, message reads "Your monthly income will not cover your loan burden and IDLC's risk appetite…", **no** tracking number. |
| AC-13 | Try to Submit Application without ticking both declarations → red toast: "Please accept both declarations to continue." Focus moves to first unticked checkbox. |
| AC-14 | Type `2500000` into any BDT field → formats live to `25,00,000`. Mid-string editing preserves cursor position. |
| AC-15 | Type `100000000` (10 crore) into EMI calculator Loan Amount → result rows update within 100ms; no upper cap. |
| AC-16 | Admin login → see paginated applications list, search by tracking number, view row detail. Export current page as CSV with all columns. |
| AC-17 | Submit any eligible application → confirmation rendered in current language → toggle to বাং → all confirmation text (including tracking-number block) re-renders in Bengali. |

---

## 8. Commercial

### 8.1 Phasing & quotation

Vendor is asked to quote **Phase 1 (fixed price)** at this stage. Phase 2 and 3 will be scoped and quoted separately after Phase 1 acceptance.

### 8.2 Payment milestones (suggested 30/40/30)

| Milestone | Trigger | % |
|---|---|---|
| M1 — Kickoff | Signed contract + technical design document submitted | 30% |
| M2 — Phase 1 acceptance | All 17 ACs demonstrated on staging environment | 40% |
| M3 — Warranty close | 30 days post-acceptance, no Sev-1 / Sev-2 bugs outstanding | 30% |

### 8.3 Technical stack

Vendor must pick from the following — no exotic frameworks without prior approval:

- **Backend:** PHP/Laravel **or** Node.js/Express **or** Python/Django
- **Frontend:** keep the existing static HTML/CSS/JavaScript stack from the prototype. No SPA framework (no React, Vue, Angular) required.
- **Database:** MySQL 8+ **or** PostgreSQL 14+
- **Hosting:** Linux VPS (DigitalOcean droplet, AWS Lightsail, or equivalent). Sub-$20/month tier acceptable for Phase 1 staging.
- **No proprietary CMS** (no Magento, Adobe Experience Manager, Oracle, SAP, etc.) without [Customer] approval.

### 8.4 Source-code ownership

All source code, design assets, database schemas, deployment scripts, and account credentials produced under this engagement are work-for-hire and become **[Customer]'s exclusive property on final payment for the corresponding phase**. The vendor retains no licence, no right to reuse the code or designs, and no right to host any artefact beyond the warranty period.

### 8.5 Warranty

30 days from Phase 1 acceptance. Vendor fixes any Sev-1 (application non-functional), Sev-2 (major flow broken), and Sev-3 (cosmetic / minor) defect at no additional charge. Sev-1 acknowledgment within 4 working hours.

### 8.6 Project management

[Customer] expects:

- Single point of contact (project lead) at vendor
- Weekly status email (max half-page)
- Staging URL accessible to [Customer] from end of week 2 onwards
- No requirement for Gantt charts, Jira dashboards, or formal PM artefacts

---

**End of document.**
