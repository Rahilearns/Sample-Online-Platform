# Loan Gateway — Educational Prototype

A static front-end prototype of a multi-page loan application gateway, built as a learning project. Pure HTML, CSS and vanilla JavaScript — no backend, no build step.

> **Disclaimer**
> This is an **educational prototype** and is **not affiliated with, endorsed by, or associated with IDLC Finance PLC** or any real financial institution. The "IDLC" branding, addresses, statistics, policy text, FAQs and stock ticker values are placeholders used for layout demonstration only. All loan policy text in the product pages is generic industry-standard sample content that **must be replaced with the operating institution's actual published policy before any production use**.

## What's inside

| Page | Purpose |
|---|---|
| `index.html` | Marketing home (hero, stats, news, why-us, quick links, footer) |
| `apply.html` | Individual / Business chooser |
| `apply-individual.html` | Home Loan / Car Loan / Personal Loan chooser |
| `apply-business.html` | SME / Corporate Loan chooser |
| `apply-home-loan.html` | Home Loan: form, EMI calculator, 6 info sections |
| `apply-car-loan.html` | Car Loan: form, EMI calculator, 6 info sections |
| `apply-personal-loan.html` | Personal Loan: form, EMI calculator, 6 info sections |

Shared assets:

- `styles.css` — single stylesheet
- `app.js` — language toggle (EN / বাং), persists via localStorage
- `calc.js` — EMI calculator (P × r × (1+r)^n / ((1+r)^n − 1)) + form submit toast
- `translations.js` — string dictionary for English and Bengali

## Features

- Bilingual: English ↔ বাংলা toggle on every page
- Floating "Customer Login" (inert) and "Apply for Loan" CTAs on the home
- Live EMI calculator on each product page (BDT-style number formatting)
- Accordion FAQs (`<details>`)
- Fully responsive (desktop / tablet / mobile)
- All clicks on the home content are dead (`pointer-events: none`) — the floating action button is the only path to apply
- Disclaimer ribbon pinned to the top of every page

## Local preview

The site is fully static. Any of these will work:

```bash
# Python 3 (recommended — already on most systems)
python -m http.server 8123

# Node
npx serve -p 8123

# PHP
php -S localhost:8123
```

Then open `http://localhost:8123`.

## Deploy to GitHub Pages

1. Create a new public repository on github.com (e.g. `loan-gateway-demo`). Do **not** initialise with a README.
2. From the project folder, run:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
3. In the repo on github.com: **Settings → Pages → Source: Deploy from a branch → main / root → Save**.
4. Wait ~1 minute. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Customising before production

If you want to keep using this for anything beyond personal learning, you should:

- Replace all "IDLC" references with your own brand name (search `IDLC` across the project; the brand string lives in `translations.js` under `brand_name` / `home_brand`).
- Replace the placeholder address, phone, email, stock ticker values in the home footer.
- Replace every `placeholder_disclaimer` block on the product pages with your institution's actual:
  - Purpose
  - Eligibility criteria
  - Credit policy
  - Required documents
  - Terms & Conditions
  - FAQ answers
- Wire the form's submit handler in `calc.js` to a real backend (email, Google Apps Script, or a webhook).

## License

For personal / educational use. Not licensed for commercial deployment in its current placeholder state.
