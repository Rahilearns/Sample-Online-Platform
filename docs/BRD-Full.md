# Loan Gateway — Business Requirements Document

**Document version:** 1.0
**Date:** May 2026
**Prepared by:** [Customer]
**For:** [Web development vendor]
**Status:** Issued for fixed-price quotation

---

## Table of contents

1. Introduction & Scope
2. User Personas & Journeys
3. Sitemap & Page-by-Page Functional Specifications
4. Business Rules & Calculation Logic
5. API Contract
6. Data Model
7. Acceptance Criteria
8. Non-Functional Requirements
9. Out-of-Scope, Assumptions & Risks
10. Commercial Terms

Appendix A — Translation string sample
Appendix B — Tracking-number format
Appendix C — Glossary
Appendix D — Sample SQL DDL

---

## 1. Introduction & Scope

### 1.1 Background

[Customer] operates in the Bangladesh Non-Banking Financial Institution (NBFI) sector and wishes to deploy an online loan application gateway. A working prototype has been built externally and is deemed sufficient as the visual and behavioural baseline. This document articulates the requirements for [Vendor] to engineer a production-ready system aligned with the prototype.

### 1.2 Document purpose

This BRD serves three functions:

1. The authoritative scope statement for this engagement
2. The reference document for acceptance testing
3. The basis for fixed-price quotation

In any disagreement between the prototype and this BRD, **this BRD prevails**.

### 1.3 Canonical references

| Reference | Location |
|---|---|
| Live prototype | https://rahilearns.github.io/Sample-Online-Platform/ |
| Source code | https://github.com/Rahilearns/Sample-Online-Platform |
| Branding placeholder | The prototype uses "IDLC" throughout as a placeholder brand. Production branding to be supplied by [Customer]. |
| Sample content | Every policy section in the prototype is marked "Sample content for prototype." Production policy text will be supplied by [Customer]. |

### 1.4 Goals & non-goals

**Goals:**

- Replicate the prototype's UX exactly in a production environment
- Establish backend infrastructure (database, admin, audit) supporting end-to-end loan application flow
- Comply with Bangladesh Bank's NBFI digital service guidelines
- Bilingual (English + Bengali) from day one
- Mobile-first responsive design
- Audit trail for every submitted application

**Non-goals (Phase 1):**

- Real SMS gateway integration
- Real CIB/CIF lookup against [Customer]'s core banking system
- Document upload, OCR, e-signature
- Customer login portal / account self-service
- Push notifications, transactional email automation
- Mobile native apps (iOS / Android)

---

## 2. User Personas & Journeys

### 2.1 Primary personas

**P1 — First-time loan applicant (mass-market)**
- Demographic: 25–45 years, salaried employee or small business owner, urban or semi-urban Bangladesh
- Device mix: 60% mobile, 40% desktop
- Language preference: ~60% Bengali, ~40% English
- Behaviour: scrolls quickly, abandons forms exceeding ~5 minutes, expects auto-fill, suspicious of being asked too much information up front
- Primary pain points: existing NBFI websites are slow, English-only, ask for too much information on the first screen, lack of feedback after submission

**P2 — Existing IDLC customer**
- Demographic: previously borrowed from IDLC
- Device mix: mostly mobile
- Behaviour: expects the system to "know them" (auto-fill from CIF), values speed over discovery
- Primary pain point: re-typing the same information that should already be on file

**P3 — SME proprietor**
- Demographic: 30–55 years, partnership or proprietorship business owner
- Device mix: desktop in office, mobile on the road
- Behaviour: cares about working-capital cycle, decision-driven by interest rate + repayment terms; reviews documents carefully
- Primary pain point: opaque pricing, slow approval cycles

**P4 — Compliance / admin reviewer**
- Demographic: IDLC employee, branch officer
- Behaviour: reviews submitted applications, processes documentation, follows up by phone with applicants
- Primary pain point: scattered information across systems, manual data re-entry

### 2.2 User journeys

**Journey 1 — First-time individual applicant (most common)**

Step-by-step:

1. Visitor lands on home page (`index.html`) from a Facebook ad or Google search
2. Scrolls through the marketing content — hero, statistics, news, why-us
3. Clicks the persistent "Apply for Loan" button (bottom-right, sticky)
4. Lands on `apply.html` → picks "Loan for Individuals"
5. Lands on `apply-individual.html` → picks (e.g.) Home Loan
6. Modal opens — picks Purpose ("Apartment Purchase") + Financing Mode ("Conventional Financing")
7. Clicks Proceed → lands on `apply-home-loan.html?purpose=Apartment+Purchase&mode=Conventional`
8. Sees a two-column page: policy information (left) + application form + EMI calculator (right). The page header shows "Home Loan | Conventional Financing" and a chip below reading "Apartment Purchase".
9. Reads through the policy summary on the left (optional, builds trust)
10. Begins the application: types Name, NID, picks DOB via three dropdowns (Day / Month / Year), enters Phone
11. Clicks **Request OTP**. Four boxes appear in place of the button. Name/NID/DOB/Phone fields are locked.
12. Receives an SMS (Phase 2) — or for Phase 1, the screen shows "Demo OTP: 1234"
13. Types `1234` into the 4 boxes (auto-advance + paste handling)
14. Clicks **Submit OTP**. OTP card collapses, full application form reveals. Page scrolls to the top of the form-card.
15. Form auto-fills if NID matched an existing client; otherwise Name carries over and CIF/Email stay blank
16. Fills the remaining 5 required fields, answers "Loan Burden?" Yes/No, conditionally fills Monthly Loan Burden, enters Expected Loan Amount and Loan Term
17. Calculator on the right mirrors the entered amount + term at the standard 13% rate
18. Ticks both declaration checkboxes
19. Clicks **Submit Application**. Server-side eligibility check runs.
20. Receives one of three confirmations:
    - **Eligible at requested amount**: green panel, "Application Submitted", message references the requested amount, tracking number issued
    - **Reduced eligible amount (≥ BDT 25 lakh)**: green panel, "Application Submitted", message references the reduced amount with different wording, tracking number issued
    - **Ineligible**: amber panel, "Application Could Not Be Processed", standard rejection text, no tracking number
21. Visitor copies the tracking number for future reference (Phase 3: status lookup page)

**Journey 2 — Existing customer**

Identical to Journey 1 up to Step 11. After Step 14, the application form auto-fills Name, CIF, and Email from the customer lookup, eliminating ~30 seconds of friction. The visitor only types the new application-specific fields (income, burden, expected amount, loan term).

**Journey 3 — SME proprietor**

Same shape as Journey 1 but starts from `apply-business.html`, with the modal asking for Desired Product (Purnota / Working Capital / Long Term Loan) instead of Purpose. Lands on `apply-sme-loan.html`. Content emphasis on business documents.

**Journey 4 — Corporate applicant (out-of-prototype)**

Visitor clicks "Loan for Corporates" → browser opens `https://idlc.com/corporate-loan` in a new tab. Visitor is routed outside this gateway entirely. No internal Corporate page exists or is needed.

**Journey 5 — Admin reviewer**

Visitor (IDLC employee) logs into the admin dashboard (Phase 1 includes login). Lands on the application list — paginated, sortable by date / status / amount. Searches by tracking number, opens row, reviews all fields. Exports the day's applications as CSV. Phase 3 will add status workflows, document review, and customer communication tools.

---

## 3. Sitemap & Page-by-Page Functional Specifications

### 3.1 Sitemap

```
index.html  (marketing home)
└── floating "Apply for Loan"
    └── apply.html
        ├── apply-individual.html
        │   └── modal: Purpose × Mode →
        │       ├── apply-home-loan.html
        │       ├── apply-car-loan.html
        │       └── apply-personal-loan.html
        └── apply-business.html
            ├── modal: Product × Mode → apply-sme-loan.html
            └── external → idlc.com/corporate-loan (new tab)

/admin (Phase 1)
├── /admin/login
└── /admin/applications
    ├── /admin/applications/:tracking_number
    └── /admin/applications/export.csv
```

### 3.2 Page-by-page specifications

#### `index.html` — Marketing home

- Persistent disclaimer ribbon at top (production: replaced or removed)
- Top navigation: brand mark (square red "I" + "IDLC"), 7 menu items (About Us, Why Choose Us, News, Career, Investor Relations, Sustainability), search icon, Login link
- Hero section: large headline + sub + two CTA buttons (decorative on home; functional CTAs are floating)
- Stat strip with 4 KPIs in a red band
- News & updates strip — 4 cards
- "Why choose us?" band on dark green/red
- Quick links — 4 cards (Monthly Business Review, Careers, Customer Portal, Stock Ticker)
- Footer with 4 link columns + city skyline illustration + social icons
- Floating bottom-right: **Customer Login** (outlined) + **Apply for Loan** (filled) — sticky, must remain visible while scrolling. Clicks inside `.home-content` are inert via `pointer-events: none`. Only the floating buttons and language toggle are clickable.
- Language toggle (EN / বাং) fixed top-right; selection persists via localStorage

#### `apply.html` — Individual / Business chooser

- Header: brand + back link to home + language toggle
- Centered eyebrow chip ("APPLY FOR A LOAN"), centered title ("What kind of loan are you looking for?"), centered subtitle
- Two large cards (Loan for Individuals, Loan for Businesses) with icons, descriptions, no Continue button (entire card is clickable)
- Footer note: "Your information is encrypted and reviewed only by authorised officers. **BB-regulated.**"

#### `apply-individual.html` — Home / Car / Personal chooser

- Three cards (Home Loan, Car Loan, Personal Loan)
- Each card has a small line-icon and the product name
- Click triggers a modal — see §3.3 for modal spec
- Modal Proceed navigates to the corresponding product page with `?purpose=...&mode=...` URL params

#### `apply-business.html` — SME / Corporate chooser

- Two cards (Loan for SME, Loan for Corporates)
- SME card click triggers a modal (same shape as Individual modal but with different dropdown content — see §3.3)
- Corporate card is a regular `<a href="https://idlc.com/corporate-loan" target="_blank" rel="noopener noreferrer">`. No modal, no internal navigation, no inline JS interception.

#### Product pages — `apply-{home,car,personal,sme}-loan.html`

Two-column layout (1600px max-width on desktop, stacks on mobile under 1200px):

**Left column (`product-info-col`, fixed 600px on desktop):** Six policy sections in order:
1. Purpose — what the loan is for
2. Eligibility — applicant criteria
3. Policy Highlights — loan amount, tenor, rate, fees
4. Required Documents — checklist
5. Terms & Conditions — numbered list
6. Frequently Asked Questions — accordion (HTML `<details>` elements)

Each section ends with the disclaimer note (production: removed/replaced).

**Right column (`product-action-col`, ~870px on 1600px):** Two stacked cards:
1. Application Form — multi-stage (see §3.4)
2. EMI Calculator — three text inputs (Amount, Rate, Tenor) + live results panel showing Monthly EMI, Total Interest, Total Payment. No upper cap on any input. See §3.5.

**Header:** Eyebrow shows product name (e.g. "HOME LOAN"). H1 reads "Home Loan | Conventional Financing" — the financing-mode suffix is appended from URL params. Below H1, a red chip shows the chosen purpose (e.g. "Apartment Purchase").

#### Admin pages (Phase 1)

- `/admin/login` — email + password form, server-side auth, session cookie
- `/admin/applications` — paginated list (20 per page), columns: tracking number, applicant name, product, applied amount, eligible amount, status, submitted at. Filter by status. Search by tracking number, NID, or phone. Export current view as CSV.
- `/admin/applications/:tracking_number` — full application detail, audit log

### 3.3 Modal specification

The modal is identical in structure across `apply-individual.html` and `apply-business.html`:

- Dimmed full-screen backdrop (closes on backdrop click)
- Centered dialog max-width 460px, padding 32px, rounded 18px
- Close button (×) top-right
- Pencil-sketch illustration at the top (product-specific SVG)
- Title — "Tell us about your [Product] Loan"
- Subtitle — "Help us route your application to the right team."
- Two dropdowns:
  - **Individual variant:** Purpose of the Loan × Financing Mode. Purpose options come from a static data structure (see Appendix A or `translations.js`). 6 options for Home, 1 for Car, 8 for Personal.
  - **Business variant:** Choose Your Desired Product × Financing Mode. Product options: Purnota / Working Capital / Long Term Loan.
- Both dropdowns start blank — no auto-selected first option, no placeholder text shown
- Financing Mode is always 2 options: Conventional Financing / Islamic Financing
- Proceed button at the bottom of the dialog — full-width red pill button
- Proceed validates both dropdowns have a value before navigating
- Esc key closes the modal

### 3.4 Multi-stage application form specification

**Stage 1 — Initial form (OTP gate)**

Fields, all required, all marked with red asterisk in label:
- Name (text)
- NID (text, pattern 10/13/17 digits, JavaScript-validated)
- Date of Birth — three dropdowns (Day, Month, Year):
  - All three start blank
  - Year populated by JavaScript: most recent first (currentYear − 18) down to (currentYear − 100)
  - Month is a static 12-option dropdown
  - Day is populated by JavaScript with 1–31 by default, narrows to the month's max when Month is picked, narrows further to honour leap years when Year is picked. Day auto-clamps if a previously selected value exceeds the new max.
- Phone (tel, pattern `01[0-9]{9}`, 11 digits)

Submit button: "Request OTP"

Validation runs on submit. If any field is invalid, focus moves to the first invalid field and a red toast appears with a field-specific message. If all valid, the OTP card slides into view.

**Stage 2 — OTP card**

- 4 single-digit boxes, monospace font, auto-advance, paste-the-whole-OTP support, backspace navigation to previous box
- Demo OTP hint: "Demo OTP: `1234`" (Phase 1 only; remove in Phase 2)
- Submit button morphs from "Request OTP" to "Submit OTP"
- On submit: if all 4 digits = `1234` → Stage 3; else clear boxes, show "Incorrect OTP. Please try again." in red, refocus first box

**Stage 3 — Full application form**

Revealed in place of Stage 1+2. Auto-scrolls to top of form-card.

Fields:

1. **Name** (text, required) — pre-filled from OTP gate, or with hardcoded existing-client name if NID matched
2. **Customer No. (CIF)** (text, optional) — pre-filled if existing client, otherwise blank
3. **Email** (email, required) — pre-filled if existing client, otherwise blank
4. **Profession** (dropdown, required) — options: Salaried / Business Owner / Self-Employed / Other
5. **Total Monthly Income (BDT)** (text, required, auto-comma formatted as user types) — spans full width
6. **Do you have any loan burden currently?** (radio, required, Yes/No)
7. **Monthly Loan Burden (BDT)** (text, required if previous answered Yes, auto-comma) — conditionally revealed
8. **Expected Loan Amount from IDLC (BDT)** (text, required, auto-comma)
9. **Loan Term (years)** (text, required)

Below the fields: two declaration checkboxes, both required:

1. *"I declare that the information provided above is true and provided in my sound mind."*
2. *"I hereby authorize IDLC to obtain my credit information from Credit Information Bureau of Bangladesh Bank and authorize IDLC to use all the information in processing the applied loan."*

At the very top of Stage 3: a horizontal progress bar showing % of required fields completed (CIF excluded from counted required when conditional checkboxes resolve appropriately).

Submit button: "Submit Application". Disabled until both declarations are ticked? No — the button is always enabled, but clicking it without ticked declarations shows a red toast and focuses the first unticked checkbox.

### 3.5 EMI Calculator specification

Located in the right column of every product page, below the application form.

**Inputs (3 free-form text fields, no upper cap):**

- Loan Amount (BDT) — auto-comma formatted as user types
- Interest Rate (%) — accepts decimals (e.g. 13.5)
- Tenor (years) — integer

**Outputs (read-only, update live within 100ms of any input change):**

- Monthly EMI
- Total Interest
- Total Payment

**Formula:** `EMI = P × r × (1+r)^n / ((1+r)^n − 1)` where P = principal (BDT), r = monthly rate (annual / 12 / 100), n = tenor in months (years × 12).

**Form-to-calc sync:** When the visitor types into the application form's "Expected Loan Amount" or "Loan Term" fields, those values mirror into the calculator's Amount and Tenor inputs, and the calculator's Rate auto-sets to 13%. After this auto-sync the visitor can override any calculator input without affecting the form.

**Initial state:** All inputs blank with `0` placeholder. Outputs show ৳ 0.

---

## 4. Business Rules & Calculation Logic

### 4.1 Eligibility decision matrix

| Parameter | Value |
|---|---|
| Standard interest rate (eligibility math) | **13.00% per annum** |
| Threshold | Total monthly load ≤ **70% of declared monthly income** |
| Reduced-amount minimum | **BDT 25,00,000** (25 lakh) |
| Currency | BDT throughout |

**Algorithm (pseudocode):**

```
income          = numeric value of "Total Monthly Income"
hasBurden       = radio "Do you have any loan burden currently?" == "yes"
monthlyBurden   = numeric value of "Monthly Loan Burden" if hasBurden else 0
expectedAmount  = numeric value of "Expected Loan Amount from IDLC"
years           = numeric value of "Loan Term (years)"
maxLoad         = income × 0.70

# Existing burden alone overshoots the threshold
if monthlyBurden > maxLoad:
    return { status: "ineligible" }

newEmi   = computeEMI(expectedAmount, 13.00, years)
totalLoad = newEmi + monthlyBurden

if totalLoad <= maxLoad:
    return { status: "eligible", amount: expectedAmount }

# Solve for the largest principal that fits the remaining room
roomForNewEmi = maxLoad - monthlyBurden
maxLoan = computeMaxLoan(roomForNewEmi, 13.00, years)
maxLoan = floor(maxLoan / 1000) * 1000   # round down to nearest BDT 1,000

if maxLoan >= 2_500_000:
    return { status: "reduced", amount: maxLoan }

return { status: "ineligible" }
```

**Inverse formula** (for computing max principal from a target EMI ceiling):

```
P_max = EMI_target × ((1+r)^n − 1) / (r × (1+r)^n)
```

### 4.2 Confirmation message templates

**Eligible (requested fits):**
> "Congratulations, you are eligible for the requested loan amount of BDT **[amount]**, subject to authenticity of your given information, further credit assessment from IDLC, and authenticity & validity of the required documents."

**Reduced (eligible < requested, but ≥ BDT 25 lakh):**
> "Congratulations, you are eligible for a loan amount of BDT **[amount]**, subject to authenticity of your given information, further credit assessment from IDLC, and authenticity & validity of the required documents."

**Ineligible:**
> "Your monthly income will not cover your loan burden and IDLC's risk appetite. We are unable to process this application at the requested amount."

Both eligible and reduced statuses receive a tracking number. Ineligible receives no tracking number.

Both templates exist in English and Bengali — see `translations.js` (keys `eligibility_eligible_html`, `eligibility_reduced_html`, `eligibility_ineligible`, `app_submitted_title`, `app_ineligible_title`).

### 4.3 OTP rules

| Rule | Phase 1 | Phase 2 |
|---|---|---|
| OTP value | Hardcoded `1234` | Random 4-digit, dispatched via SMS gateway |
| Expiry | n/a (always valid) | 5 minutes |
| Max retries | n/a | 3 per phone per hour |
| Send rate-limit | n/a | 5 per phone per hour, 3 per IP per minute |
| Delivery channel | Demo hint shown on UI | Bangladesh-licensed SMS gateway (vendor recommendation; options: SSLWireless, SMS Express, Robi Axiata corporate SMS) |

### 4.4 Existing-client lookup

| Rule | Phase 1 | Phase 2 |
|---|---|---|
| Trigger | OTP success | OTP success |
| Source | Hardcoded mapping | [Customer]'s CIF / core banking API |
| Match key | NID | NID + DOB (composite for security) |
| Fields returned on match | Name, CIF, Email | Name, CIF, Email (+ extensible) |
| Behaviour on match | Auto-fill silently in the application form | Same |
| Behaviour on no match | Carry over typed Name from OTP gate; CIF + Email blank | Same |
| UX side-effect | None (no notification, no badge) | Same |

### 4.5 Validation rules

| Field | Pattern / Rule |
|---|---|
| Name | Non-empty, trimmed |
| NID | `^[0-9]{10,17}$` |
| DOB | Valid Gregorian date; applicant ≥ 18 years on date of OTP request; ≤ 100 years old |
| Phone | `^01[0-9]{9}$` (Bangladesh mobile, 11 digits) |
| OTP | 4 digits, all from 0-9 |
| Email | Standard HTML5 email pattern |
| Profession | One of: salaried, business, self, other |
| All monetary fields | Non-negative integer in BDT |
| Loan Term | Positive integer (years) |
| Declarations | Both must be checked |

### 4.6 Tracking number generation

- Format: `IDLC-YYMMDD-XXXX`
  - `IDLC` — fixed brand prefix (production: replaced with [Customer]'s production brand)
  - `YYMMDD` — date of application (2-digit year, month, day)
  - `XXXX` — 4-char alphanumeric, uppercase, excluding `0`, `O`, `1`, `I`, `L` to avoid visual ambiguity
- Generated server-side, atomically, with database UNIQUE constraint on the tracking_number column
- Generated only on `eligible` and `reduced` statuses
- Example: `IDLC-260520-K7P4`

---

## 5. API Contract

All endpoints:
- Return JSON
- Use HTTPS (TLS 1.2+)
- Use bearer-token authentication post-OTP (token issued by `/api/otp/verify`)
- Validation errors → HTTP 400 with `{errors: [{field, message}]}`
- Server errors → HTTP 5xx with `{error_id}` (for audit log lookup)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/otp/request` | POST | none | Initiate OTP for a phone+name+NID+DOB combination |
| `/api/otp/verify` | POST | none | Verify entered OTP; issue session bearer token |
| `/api/customer/lookup` | GET | bearer | NID-based existing-client check |
| `/api/applications` | POST | bearer | Submit full application; run eligibility; return result |
| `/api/applications/:tracking` | GET | bearer or admin | Read application by tracking number |
| `/api/admin/applications` | GET | admin | Paginated list with filters |
| `/api/admin/applications/export` | GET | admin | CSV export |

### 5.1 `POST /api/otp/request`

Request:
```json
{
  "name": "Md. Rakib Hasan",
  "nid": "5102284394",
  "dob": "1990-05-15",
  "phone": "01712345678"
}
```

Response (Phase 1 — always success):
```json
{ "success": true, "expires_in": 300 }
```

### 5.2 `POST /api/otp/verify`

Request:
```json
{ "phone": "01712345678", "otp": "1234" }
```

Response (success):
```json
{ "success": true, "token": "<JWT>" }
```

Response (failure):
```json
{ "success": false, "error": "incorrect_otp" }
```

### 5.3 `GET /api/customer/lookup`

Request: `?nid=5102284394` (Authorization: Bearer <JWT>)

Response (match):
```json
{
  "exists": true,
  "name": "Mahfuzul Islam",
  "cif": "553577",
  "email": "Imahfuzul@gmail.com"
}
```

Response (no match):
```json
{ "exists": false }
```

### 5.4 `POST /api/applications`

Request (full payload):
```json
{
  "product": "home-loan",
  "purpose": "Apartment Purchase",
  "financing_mode": "Conventional",
  "name": "Md. Rakib Hasan",
  "nid": "5102284394",
  "dob": "1990-05-15",
  "phone": "01712345678",
  "cif": "553577",
  "email": "Imahfuzul@gmail.com",
  "profession": "salaried",
  "monthly_income": 200000,
  "has_burden": false,
  "monthly_burden": null,
  "expected_amount": 2500000,
  "loan_term_years": 5,
  "declaration_1": true,
  "declaration_2": true,
  "language": "en"
}
```

Response (eligible):
```json
{
  "tracking_number": "IDLC-260520-K7P4",
  "status": "eligible",
  "eligible_amount": 2500000
}
```

Response (reduced):
```json
{
  "tracking_number": "IDLC-260520-Q2RN",
  "status": "reduced",
  "eligible_amount": 3070000
}
```

Response (ineligible):
```json
{
  "tracking_number": null,
  "status": "ineligible",
  "eligible_amount": 0
}
```

### 5.5 `GET /api/admin/applications`

Query parameters: `?page=1&size=20&status=eligible&product=home-loan&q=rakib`

Response:
```json
{
  "total": 142,
  "page": 1,
  "size": 20,
  "applications": [ { ... }, { ... } ]
}
```

---

## 6. Data Model

### 6.1 Tables

**`applications`** — primary record

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PRIMARY KEY | |
| `tracking_number` | VARCHAR(20) UNIQUE | NULL if status = ineligible |
| `product` | ENUM | home-loan, car-loan, personal-loan, sme-loan |
| `purpose` | VARCHAR(120) | |
| `financing_mode` | ENUM | Conventional, Islamic |
| `name` | VARCHAR(120) NOT NULL | |
| `nid` | VARCHAR(20) NOT NULL | INDEX |
| `dob` | DATE NOT NULL | |
| `phone` | VARCHAR(15) NOT NULL | INDEX |
| `cif` | VARCHAR(20) NULLABLE | |
| `email` | VARCHAR(120) | |
| `profession` | ENUM | salaried, business, self, other |
| `monthly_income` | DECIMAL(15,2) | |
| `has_burden` | BOOLEAN | |
| `monthly_burden` | DECIMAL(15,2) NULLABLE | |
| `expected_amount` | DECIMAL(15,2) | |
| `loan_term_years` | INT | |
| `eligibility_status` | ENUM | eligible, reduced, ineligible |
| `eligible_amount` | DECIMAL(15,2) | 0 if ineligible |
| `language` | ENUM | en, bn |
| `declarations_accepted_at` | TIMESTAMP | |
| `ip_address` | VARCHAR(45) | IPv4 or IPv6 |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMP DEFAULT NOW() | |
| `updated_at` | TIMESTAMP DEFAULT NOW() ON UPDATE NOW() | |

**`audit_log`** — append-only

| Column | Type |
|---|---|
| `id` | UUID PRIMARY KEY |
| `application_id` | UUID FK → applications.id |
| `event_type` | VARCHAR(40) |
| `actor` | VARCHAR(120) — "system", admin email, or NULL |
| `timestamp` | TIMESTAMP |
| `payload` | JSON |

**`otp_requests`** — short-lived, can be purged after 24 hours

| Column | Type |
|---|---|
| `id` | UUID PRIMARY KEY |
| `phone` | VARCHAR(15) |
| `code_hash` | VARCHAR(64) — never store the raw OTP |
| `requested_at` | TIMESTAMP |
| `expires_at` | TIMESTAMP |
| `verified_at` | TIMESTAMP NULLABLE |
| `attempt_count` | INT DEFAULT 0 |

**`admin_users`** — Phase 1 admin login

| Column | Type |
|---|---|
| `id` | UUID PRIMARY KEY |
| `email` | VARCHAR(120) UNIQUE |
| `password_hash` | VARCHAR(120) — bcrypt or argon2 |
| `role` | ENUM (admin, reviewer) |
| `created_at` | TIMESTAMP |
| `last_login_at` | TIMESTAMP NULLABLE |

### 6.2 Relationships

- `applications.id` → `audit_log.application_id` (1-to-many)
- `applications.phone` → `otp_requests.phone` (loose link, not FK)

See Appendix D for sample DDL.

---

## 7. Acceptance Criteria

Each AC is demonstrable in under 60 seconds on the staging environment.

| # | Criterion |
|---|---|
| AC-1 | Open `/` → disclaimer ribbon visible at top; brand, lang toggle, hero, stat strip, news cards, why-us band, quick links, footer all render; floating Customer Login + Apply for Loan pinned bottom-right; scrolling does not move them. |
| AC-2 | Click বাং on any page → all visible UI translates → click any internal link → still in Bengali → refresh → still in Bengali. |
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
| AC-18 | Submit an eligible application → check the audit log table for: `application_created`, `eligibility_checked`, `tracking_number_issued` rows. |
| AC-19 | Attempt OTP verification with code other than `1234` → server returns 400 with `incorrect_otp`. OTP card shows error message; boxes clear; first box re-focused. |
| AC-20 | Page-by-page Lighthouse mobile audit: performance ≥ 85, accessibility ≥ 90, best practices ≥ 90, SEO ≥ 90. |

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Time to First Contentful Paint (FCP) on 3G mobile: **< 2.5s**
- Total Blocking Time (TBT): **< 300ms**
- Form submission round-trip on Phase 1 stub: **< 800ms**
- 95th percentile response time for any API: **< 500ms**
- Page weight per route: **< 500 KB transferred** (excluding fonts)

### 8.2 Security

- HTTPS everywhere — Let's Encrypt acceptable, must auto-renew
- OWASP Top 10 mitigations
- Server-side validation on every input (do not trust client-side validation)
- NID treated as sensitive PII — encrypted at rest, never written to access logs
- Rate limiting: max 5 OTP requests per phone per hour, 3 per IP per minute
- Session timeout: 30 minutes idle
- CSRF tokens on all POST endpoints
- Strict Content Security Policy headers
- HSTS headers with `max-age=31536000; includeSubDomains; preload`
- All database queries parameterized (no string concatenation)
- Passwords hashed with bcrypt (cost 12+) or argon2id
- No PII in URL paths, query strings, log statements, or analytics events

### 8.3 Compliance

- Bangladesh Bank Digital Banking and NBFI service guidelines (vendor to confirm latest version applicable)
- Data residency: customer data must reside on servers physically located in Bangladesh
- Audit trail: every submitted application logged with timestamp, IP, user-agent, full payload at time of submission
- Retention: applications retained for 7 years per BB requirements
- KYC compliance hooks (Phase 2 — vendor must architect the schema to accommodate KYC fields even in Phase 1)

### 8.4 Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation for all flows (Tab, Shift+Tab, Enter, Esc)
- Screen-reader compatibility (aria-* attributes already present in the prototype — preserve)
- Colour contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for UI elements
- Focus indicators on every interactive element
- Form errors announced to assistive technology

### 8.5 Browser support

- Chrome 90+ (desktop, Android)
- Safari 14+ (desktop, iOS)
- Firefox 90+
- Edge 90+
- Internet Explorer **not required**

### 8.6 Hosting & SLA

| Metric | Phase 1 target | Phase 2 target |
|---|---|---|
| Uptime | 99.5% (single instance) | 99.9% (with redundancy + standby) |
| Daily DB backup | Required, 7-day retention | Required, 30-day retention |
| Weekly full backup | Required, 90-day retention | Required, 365-day retention |
| Monitoring | Basic uptime + error-rate | Full APM (response times, error rates, throughput) |
| Alert channels | Email + SMS to [Customer] contact | + on-call rotation |

### 8.7 Internationalisation

- English + Bengali only in Phase 1
- All UI strings must be sourced from a single translation file (`translations.js` in the prototype). No hardcoded English in HTML or rendered server output.
- Date formatting respects the active language
- Number formatting (commas) uses Bangladeshi style (12,34,567) in both languages
- Bengali font: Hind Siliguri preferred (already in the prototype)

---

## 9. Out-of-Scope, Assumptions & Risks

### 9.1 Out of scope (Phase 1)

- Real SMS gateway integration
- Real CIF / NID lookup against [Customer]'s core banking system
- Document upload, OCR, e-signature, e-KYC
- Push notifications
- Transactional email automation (welcome emails, status updates)
- Customer Login flow / account self-service / loan-status portal for customers
- Mobile native apps (iOS, Android)
- Multi-tenancy (one institution = one deployment)
- Marketing analytics integration (GA4, Facebook Pixel) — vendor adds Phase 3 if requested
- A/B testing infrastructure

### 9.2 Assumptions

| ID | Assumption |
|---|---|
| A1 | [Customer] will provide a production domain + DNS access |
| A2 | [Customer] will provide brand assets (logo, final colour palette, brand guidelines) before Phase 1 acceptance demo |
| A3 | [Customer] will provide the production SSL certificate or approve Let's Encrypt |
| A4 | All production content (policy text, T&Cs, FAQs, real address, real phone, real stock-ticker values, news items) will be supplied by [Customer] in editable format before launch |
| A5 | SMS gateway selection and contract is [Customer]'s responsibility |
| A6 | CIB/CIF API endpoint specifications will be provided by [Customer] before Phase 2 kickoff |
| A7 | [Customer] designates a single project owner empowered to make scope and acceptance decisions |
| A8 | Acceptance testing performed by [Customer]; vendor provides UAT support but is not responsible for [Customer]'s internal test cycle duration |
| A9 | The placeholder content in the prototype (sample policy, sample T&Cs, sample address, sample stock prices, sample news) carries no IP rights or legal weight; [Customer] will replace all of it before launch |
| A10 | The "IDLC" branding in the prototype is a working placeholder. Production deployment will use [Customer]'s actual brand. Any external link in the prototype (e.g. `idlc.com/corporate-loan`) will be reviewed by [Customer] for production. |

### 9.3 Risks

| ID | Risk | Mitigation |
|---|---|---|
| R1 | SMS gateway integration takes longer than estimated | Phase 2 is quoted separately; Phase 1 uses stubs |
| R2 | CIB/CIF API spec from [Customer] is incomplete | Phase 1 schema accommodates lookup; vendor's Phase 2 quote can be revised |
| R3 | Bangladesh Bank guidelines change mid-engagement | Compliance hooks designed for extensibility; vendor accommodates within reason |
| R4 | Browser support edge cases (older Android browsers) | Vendor targets evergreen browsers; degradation handled gracefully |
| R5 | Performance on rural 2G/3G | Static front-end + minified assets + small page weight target (§8.1) |
| R6 | Scope creep mid-Phase-1 | Change-request process: any change requires written approval + new fixed-price addendum |

---

## 10. Commercial Terms

### 10.1 Phasing & quotation

Vendor is asked to quote **Phase 1 (fixed price)** at this stage. Phase 2 and Phase 3 are scoped at a high level here but will be re-scoped and quoted separately at the appropriate time.

### 10.2 Payment milestones (Phase 1)

| Milestone | Trigger | % |
|---|---|---|
| M1 — Kickoff | Signed contract + technical design document (≤ 10 pages) submitted by vendor | 30% |
| M2 — Phase 1 acceptance | All 20 ACs demonstrated on staging environment + [Customer] sign-off | 40% |
| M3 — Warranty close | 30 days post-acceptance, no Sev-1 / Sev-2 bugs outstanding | 30% |

### 10.3 Technical stack

Vendor must pick from the following — no exotic frameworks without prior approval:

| Layer | Allowed |
|---|---|
| Backend | PHP/Laravel, Node.js/Express, Python/Django |
| Frontend | Static HTML/CSS/JavaScript (the prototype's stack). No SPA framework. |
| Database | MySQL 8+, PostgreSQL 14+ |
| Hosting | Linux VPS (DigitalOcean droplet, AWS Lightsail, equivalent). Sub-$20/month tier acceptable for Phase 1 staging. |
| Build tools | None required; if used, must be free/open-source and not introduce licence costs |
| Proprietary CMS | Not permitted (no Magento, Adobe Experience Manager, Oracle, SAP) without [Customer] approval |

### 10.4 Source-code ownership

All source code, design assets, database schemas, deployment scripts, API specifications, technical design documents, and account credentials produced under this engagement are work-for-hire and become **[Customer]'s exclusive property on final payment for the corresponding phase**. The vendor retains no licence, no right to reuse the code or designs in other engagements, and no right to host any artefact beyond the warranty period.

### 10.5 Warranty

30 days from Phase 1 acceptance. Vendor fixes any:

- **Sev-1** (application non-functional, data loss risk) — acknowledgment within 4 working hours, fix within 24 hours
- **Sev-2** (major flow broken, security defect) — acknowledgment within 1 working day, fix within 5 working days
- **Sev-3** (cosmetic / minor) — fix in next scheduled release window

…at no additional charge.

### 10.6 Project management

[Customer] expects:

- Single point of contact (project lead) at vendor — name + email + phone in the proposal
- Weekly status email (max half-page, plain text)
- Staging URL accessible to [Customer] from end of week 2 onwards
- No requirement for Gantt charts, Jira dashboards, or formal PM artefacts
- Change requests handled via written addendum (no informal scope changes)

### 10.7 Proposal expectations

The vendor's proposal should include:

1. Total fixed price for Phase 1 (BDT, exclusive of VAT)
2. Indicative duration (weeks from kickoff to acceptance demo)
3. Named team (project lead + ≥ 1 backend + ≥ 1 front-end developer)
4. Technical-design document outline (1–2 pages, not the full doc)
5. References — at least 2 prior BD-NBFI / fintech projects
6. Assumptions made by vendor (any deviations from §9.2)

---

## Appendix A — Translation string sample

A small subset, for the vendor's reference. Full set in `translations.js`:

| Key | English | বাংলা |
|---|---|---|
| login | Customer Login | গ্রাহক লগইন |
| apply | Apply for Loan | ঋণের আবেদন |
| brand_name | IDLC | আইডিএলসি |
| choose_loan_type | Choose your loan type | আপনার ঋণের ধরন নির্বাচন করুন |
| prod_home_loan | Home Loan | গৃহ ঋণ |
| prod_car_loan | Car Loan | গাড়ি ঋণ |
| prod_personal_loan | Personal Loan | ব্যক্তিগত ঋণ |
| prod_sme_loan | SME Loan | এসএমই ঋণ |
| modal_purpose_label | Purpose of the Loan | ঋণের উদ্দেশ্য |
| modal_financing_label | Financing Mode | অর্থায়ন পদ্ধতি |
| modal_financing_conventional | Conventional Financing | প্রচলিত অর্থায়ন |
| modal_financing_islamic | Islamic Financing | ইসলামিক অর্থায়ন |
| request_otp | Request OTP | ওটিপি অনুরোধ করুন |
| submit_otp | Submit OTP | ওটিপি জমা দিন |
| form_submit | Submit Application | আবেদন জমা দিন |
| app_submitted_title | Application Submitted | আবেদন জমা দেওয়া হয়েছে |
| app_ineligible_title | Application Could Not Be Processed | আবেদন প্রক্রিয়া করা যায়নি |
| dob_age_required | Applicants must be at least 18 years of age to submit this loan application. | এই ঋণের আবেদন জমা দেওয়ার জন্য আবেদনকারীর বয়স কমপক্ষে ১৮ বছর হতে হবে। |

Full file: `translations.js` in the repository — ~250 keys, two languages.

---

## Appendix B — Tracking-number format

```
IDLC-YYMMDD-XXXX
│    │       └── 4-char alphanumeric, uppercase
│    │           Charset: A-Z + 2-9 (no 0, O, 1, I, L)
│    └── Date of submission: YY MM DD
└── Fixed brand prefix (replace at production-brand cutover)

Example: IDLC-260520-K7P4
```

Tracking numbers are:

- Issued only on `eligible` and `reduced` outcomes (never on `ineligible`)
- Globally unique (database UNIQUE constraint)
- Generated server-side (never client-side)
- Returned in the API response and rendered to the visitor on success
- Stored in `applications.tracking_number`

---

## Appendix C — Glossary

| Term | Meaning |
|---|---|
| NBFI | Non-Banking Financial Institution |
| CIF | Customer Information File — legacy term for a customer's master record |
| CIB | Credit Information Bureau — Bangladesh Bank's credit-reporting body |
| NID | National Identity Document — Bangladesh national ID |
| EMI | Equated Monthly Instalment |
| KYC | Know Your Customer |
| MFS | Mobile Financial Services (bKash, Nagad, Rocket, etc.) |
| BB | Bangladesh Bank — central bank |
| LTV | Loan to Value |
| DTI | Debt to Income |
| OTP | One-Time Password |
| BDT | Bangladeshi Taka (currency) |
| OWASP | Open Web Application Security Project |
| HSTS | HTTP Strict Transport Security |
| CSP | Content Security Policy |
| WCAG | Web Content Accessibility Guidelines |
| Sev-1 / 2 / 3 | Severity classifications for defects |
| Phase 1 / 2 / 3 | Engagement phases — MVP / Integration / Enhancements |

---

## Appendix D — Sample SQL DDL

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  tracking_number VARCHAR(20) UNIQUE,
  product VARCHAR(20) NOT NULL,
  purpose VARCHAR(120),
  financing_mode VARCHAR(20),
  name VARCHAR(120) NOT NULL,
  nid VARCHAR(20) NOT NULL,
  dob DATE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  cif VARCHAR(20),
  email VARCHAR(120),
  profession VARCHAR(20),
  monthly_income DECIMAL(15,2),
  has_burden BOOLEAN,
  monthly_burden DECIMAL(15,2),
  expected_amount DECIMAL(15,2),
  loan_term_years INT,
  eligibility_status VARCHAR(15),
  eligible_amount DECIMAL(15,2),
  language VARCHAR(2),
  declarations_accepted_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_applications_nid ON applications(nid);
CREATE INDEX idx_applications_phone ON applications(phone);
CREATE UNIQUE INDEX idx_applications_tracking ON applications(tracking_number);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  event_type VARCHAR(40),
  actor VARCHAR(120),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload JSON
);

CREATE TABLE otp_requests (
  id UUID PRIMARY KEY,
  phone VARCHAR(15),
  code_hash VARCHAR(64),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  attempt_count INT DEFAULT 0
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(120) UNIQUE,
  password_hash VARCHAR(120),
  role VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

---

**End of document.**
