# PV-Valuator PRO INTL

International version of **PV-Valuator PRO**, a full-stack web application for the financial and economic valuation of photovoltaic (PV) systems.

The application is designed for international users and provides professional PV valuation and financial analysis tools, including **Depreciated Asset Value**, **PV Economic Value**, **Residual Value**, **Financial Analysis**, **PVGIS-based production data**, and **PDF valuation reports**.

The backend is built with **Flask / Python** and the frontend with **React / Vite**.

---

## 🌍 International Version

This repository contains the international version of PV-Valuator PRO.

- **International website:** https://pv-valuator.com
- **Spanish version:** https://pv-valuator.com/es/
- **Application:** https://app.pv-valuator.com/
- **Backend API:** https://api.pv-valuator.com/

The international version is country-neutral and does not use German-specific regulations, tariffs, or market assumptions.

The initial international version uses **USD ($)** as its currency.

---

## 🏗️ Project Structure

```text
pv-value-analyzer-intl/
│
├─ backend/
│  ├─ app.py                 # Flask backend application
│  ├─ models.py              # Database models
│  ├─ requirements.txt       # Python dependencies
│  ├─ uploads/               # Temporary uploaded files
│  ├─ pdfs/                  # Generated PDF reports
│  └─ ...
│
├─ frontend/
│  ├─ src/
│  │  ├─ components/         # React components
│  │  ├─ pages/              # Application pages
│  │  ├─ assets/             # Images and other assets
│  │  ├─ App.jsx             # Main React application
│  │  └─ ...
│  ├─ index.html
│  ├─ package.json
│  └─ ...
│
├─ .gitignore
└─ README.md

⚙️ Features
PV System Information

The application allows users to enter and manage:

PV system information
Technical system data
Location data
System age and lifetime
Maintenance and condition information
Installed capacity (kWp)
Specific annual yield
Performance Ratio (PR)
Annual degradation
Operating expenses (OPEX)
PV Operating Models

The international version currently supports:

Full Grid Export
Self-consumption + Grid Export
Self-consumption + Battery (BESS)

The application calculates the corresponding energy and economic flows for each operating model.

Depreciated Asset Value

Calculates the depreciated value of the PV system based on:

Acquisition cost
System age
Useful lifetime
Depreciation method

The result is presented in USD.

PV Economic Value

Calculates the economic value of future PV energy production using:

Installed capacity
PVGIS production data
Specific yield
Performance Ratio
Electricity/export price
Self-consumption
Battery losses where applicable
Annual degradation
OPEX
Remaining lifetime

The calculation includes:

Annual gross revenue
Annual net economic value
Cumulative PV economic value
Net Present Value (NPV)
PVGIS Integration

The application can retrieve photovoltaic production data from the PVGIS API based on the selected geographic location.

The PVGIS integration provides:

Annual PV production
Specific annual yield
Geographic coordinates

The location can be synchronized with the PV system data entered in the application.

Residual Value

The application provides an indicative residual-value calculation based on future economic benefits and configurable deductions.

The residual value should be considered an indicative valuation result and not a certified market appraisal.

Financial Analysis

The financial analysis includes:

Initial investment
Annual cash flows
OPEX
NPV
IRR
Payback period
Cash-flow analysis
Financial dashboard

The analysis uses USD in the international version.

PDF Valuation Reports

The application generates professional PDF reports containing:

PV system information
Technical data
Location data
Operating model
Depreciated Asset Value
PV Economic Value
Residual Value
Financial Analysis
Cash-flow analysis
Overall assessment
Analyst / company information
Optional logo

Generated reports use USD formatting and international terminology.

💳 Credit System

PV-Valuator PRO INTL uses a credit-based system.

New users receive an initial welcome credit.

Credits can be consumed when generating professional PDF valuation reports.

The international credit balance is stored separately from the German-market credit balance in the shared Supabase database.

The international application uses:

balance_intl

for INTL credits and records international credit transactions with:

market = INTL
💰 Stripe Payments

The international version uses Stripe for credit purchases.

International products are priced in USD.

Credit packages are configured through the backend using the international Stripe product configuration.

Stripe payment flow:

PV-Valuator INTL
       │
       ▼
Stripe Checkout
       │
       ▼
checkout.session.completed
       │
       ▼
INTL credit allocation
       │
       ▼
Supabase
       │
       ▼
balance_intl

Stripe secret keys and webhook secrets are stored only in environment variables and must never be committed to GitHub.

🗄️ Database

The application uses Supabase / PostgreSQL.

The international version uses the existing Supabase project and shares the authentication system with the German application while maintaining separate international credit balances.

Relevant database structures include:

auth.users
users
profiles
credit_accounts
credit_transactions
reports

International credits use:

credit_accounts.balance_intl

and international credit transactions use:

credit_transactions.market = INTL
🔐 Environment Variables

Environment variables are required for local development and production.

Backend

The backend uses environment variables for:

PostgreSQL / Supabase database connection
Stripe secret key
Stripe webhook secret
Frontend URL
Stripe success URL
Stripe cancellation URL

Example:

DATABASE_URL=your_database_connection_string

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

FRONTEND_URL=http://localhost:5173

STRIPE_SUCCESS_URL=http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}

STRIPE_CANCEL_URL=http://localhost:5173/payment-cancel
Frontend
VITE_BACKEND_URL=http://localhost:5001

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key

Never commit .env files or private API keys to GitHub.

💻 Local Development
Backend

From the project root:

cd backend

Create and activate a Python virtual environment:

python3 -m venv venv
source venv/bin/activate

On Windows:

.\venv\Scripts\activate

Install the dependencies:

pip install -r requirements.txt

Start the Flask backend:

python app.py

The backend will run locally at:

http://localhost:5001

The basic health check is available at:

http://localhost:5001/
Frontend

Open another terminal and navigate to the frontend:

cd frontend

Install the dependencies:

npm install

Start the Vite development server:

npm run dev

The frontend will normally run at:

http://localhost:5173

The frontend communicates with the backend through:

VITE_BACKEND_URL=http://localhost:5001
🚀 Production Deployment

The international version is intended to be deployed using Render.

Production architecture
pv-valuator.com
       │
       └── International landing page
       
app.pv-valuator.com
       │
       └── React / Vite application
                  │
                  ▼
api.pv-valuator.com
       │
       └── Flask API
             │
             ├── Supabase / PostgreSQL
             ├── PVGIS
             └── Stripe
Backend

The Flask backend can be deployed as a Render Web Service.

Typical build command:

pip install -r backend/requirements.txt

Typical start command:

gunicorn backend.app:app

Production environment variables must be configured directly in Render.

The production backend URL is:

https://api.pv-valuator.com
Frontend

The React/Vite frontend can be deployed as a Render Static Site.

The production frontend should use:

VITE_BACKEND_URL=https://api.pv-valuator.com

The production application URL is:

https://app.pv-valuator.com
📡 API Endpoints
Endpoint	Method	Description
/	GET	Basic backend health check
/test	GET	API status test
/buchwert	POST	Calculates Depreciated Asset Value
/ertragswert	POST	Calculates PV Economic Value
/restwert	POST	Calculates Residual Value
/pvgis	POST	Retrieves PVGIS production data
/pdf	POST	Generates a professional PDF valuation report
/credits/<email>	GET	Retrieves the user's INTL credit balance
/users/sync	POST	Synchronizes authenticated user data
/create-checkout-session	POST	Creates a Stripe Checkout session
/checkout-session/<session_id>	GET	Retrieves Stripe Checkout session information
📊 PV Economic Calculation

The international version calculates the economic value of future PV production using the system's technical and financial parameters.

The calculation takes into account:

PV production
Export price
Electricity value
Self-consumption
Battery losses
Annual degradation
OPEX
Remaining lifetime
Discount rate

The application also calculates a financial NPV based on the initial investment and projected annual cash flows.

📄 PDF Reports

PDF reports are generated by the Flask backend.

The reports include professional sections for:

System information
Technical data
Location
Operating model
Depreciated Asset Value
PV Economic Value
Residual Value
Financial Analysis
Cash flows
Overall assessment
Analyst information

Generated PDFs use international terminology and USD currency formatting.

🔒 Security

The following information must never be committed to GitHub:

.env
Database passwords
Stripe secret keys
Stripe webhook secrets
Supabase service-role keys
Other private API credentials

The repository .gitignore excludes environment files.

The Supabase publishable/anonymous key may be used by the frontend according to the Supabase security model, while private service-role credentials must remain server-side.

📌 Deployment Notes
Render's filesystem is ephemeral.
Generated PDFs and temporary uploads should not be considered permanent storage.
Persistent file storage can be added in the future if required.
Production environment variables must be configured in Render.
The frontend must point to the production backend URL.
Stripe production webhooks must point to the production backend.
DNS and SSL must be configured for the production domains.
🌐 Related Websites
International Market

https://pv-valuator.com

Spanish Version

https://pv-valuator.com/es/

Application

https://app.pv-valuator.com/

API

https://api.pv-valuator.com/

German Market

https://www.pv-valuator.de/

👨‍💻 Author

Developed by geeky4dev

PV-Valuator PRO INTL
Fullstack International PV Valuation and Financial Analysis Platform Tool in Python/Flask

Built with:

Python
Flask
React
Vite
Supabase
PostgreSQL
Stripe
PVGIS
FPDF2