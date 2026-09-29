from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from fpdf import FPDF
from fpdf.enums import XPos, YPos

import os
import uuid
import base64
import tempfile
import traceback
import requests
import io
import datetime
import re
import gc

import matplotlib

import re

matplotlib.use("Agg")
matplotlib.rcParams['backend'] = 'Agg'

import matplotlib.pyplot as plt

import stripe

from dotenv import load_dotenv

from config import Config

from models import (
    db,
    User,
    CreditAccount,
    CreditTransaction,
    Report
)

# ======================================================
# LOAD ENVIRONMENT VARIABLES
# ======================================================

load_dotenv()

# ======================================================
# TEMP DIRECTORY FOR PDF FILES
# ======================================================

TEMP_DIR = os.path.join(
    os.getcwd(),
    "temp"
)

os.makedirs(
    TEMP_DIR,
    exist_ok=True
)


# ======================================================
# STRIPE CONFIGURATION
# ======================================================

stripe.api_key = os.getenv(
    "STRIPE_SECRET_KEY"
)

if not stripe.api_key:

    raise RuntimeError(
        "STRIPE_SECRET_KEY no está configurada"
    )

STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET"
)

if not STRIPE_WEBHOOK_SECRET:

    raise RuntimeError(
        "STRIPE_WEBHOOK_SECRET no está configurada"
    )    


# ======================================================
# STRIPE PRODUCTS / CREDIT PACKAGES
# ======================================================

STRIPE_PRODUCTS_INTL = {
    "starter": {
        "price_id": "price_1UKkUlLrbrHMdmYw6wbnErY5",
        "credits": 10
    },
    "professional": {
        "price_id": "price_1UKkj2LrbrHMdmYw27S2yunS",
        "credits": 25
    },
    "expert": {
        "price_id": "price_1UKkkOLrbrHMdmYwSkFGocpm",
        "credits": 50
    },
    "business": {
        "price_id": "price_1UKklqLrbrHMdmYwp8tTUTwV",
        "credits": 100
    }
}

# ======================================================
# CREDIT PACKAGES
# ======================================================

#CREDIT_PACKAGES = {

#    "starter": {
#        "name": "Starter",
#        "credits": 10,
#        "price_cents": 1500
#    },

#    "professional": {
#        "name": "Professional",
#        "credits": 25,
#        "price_cents": 2900
#    },

#    "expert": {
#        "name": "Expert",
#        "credits": 50,
#        "price_cents": 4900
#    },

#    "business": {
#        "name": "Business",
#        "credits": 100,
#        "price_cents": 7900
#    }

#}

# ======================================================
# STRIPE CHECKOUT URLS
# ======================================================

STRIPE_SUCCESS_URL = os.getenv(
    "STRIPE_SUCCESS_URL",
    "http://localhost:5173/payment-success"
)

STRIPE_CANCEL_URL = os.getenv(
    "STRIPE_CANCEL_URL",
    "http://localhost:5173/payment-cancel"
)


# ======================================================
# FLASK APP
# ======================================================
app = Flask(__name__)

app.config.from_object(Config)

db.init_app(app)

CORS(app)

# -------------------- Credits Endpoint --------------------

@app.route("/credits/<email>", methods=["GET"])
def get_credits(email):

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "balance": 0
        })

    account = CreditAccount.query.filter_by(
        user_id=user.id
    ).first()

    if not account:
        return jsonify({
            "balance": 0
        })

    return jsonify({
        "balance": account.balance_intl
    })


# ======================================================
# STRIPE CHECKOUT SESSION
# ======================================================

@app.route(
    "/stripe/checkout-session/<session_id>",
    methods=["GET"]
)
def get_checkout_session(session_id):

    try:

        session = stripe.checkout.Session.retrieve(
            session_id
        )

        if session.payment_status != "paid":

            return jsonify({
                "paid": False
            }), 200

        return jsonify({

            "paid": True,

            "transaction_id": session.id,

            "value": (
                session.amount_total / 100
                if session.amount_total is not None
                else 0
            ),

            "currency": (
                session.currency.upper()
                if session.currency
                else "EUR"
            ),

            "package": (
                session.metadata.get("package")
                if session.metadata
                else None
            ),

            "credits": (
                int(session.metadata.get("credits", 0))
                if session.metadata
                else 0
            )

        }), 200

    except stripe.error.StripeError as e:

        print(
            "STRIPE SESSION ERROR:",
            str(e)
        )

        return jsonify({
            "error": "Stripe session could not be retrieved"
        }), 400

    except Exception as e:

        print(
            "CHECKOUT SESSION ERROR:",
            str(e)
        )

        return jsonify({
            "error": "Internal server error"
        }), 500

# ======================================================
# CREDIT MANAGEMENT
# ======================================================


def get_user_by_email(email):

    return User.query.filter_by(
        email=email
    ).first()



def create_user_if_not_exists(
    supabase_user_id,
    email,
    name=None,
    company=None
):

    user = User.query.filter_by(
        id=supabase_user_id
    ).first()


    if user:

        return user



    try:

        user = User(
            id=supabase_user_id,
            email=email,
            name=name,
            company=company
        )


        db.session.add(user)


        db.session.flush()



        # ==========================================
        # WELCOME CREDIT
        # ==========================================

        account = CreditAccount(
            user_id=user.id,
            balance_intl=1
        )


        db.session.add(account)



        transaction = CreditTransaction(

            user_id=user.id,

            type="WELCOME_CREDIT",

            amount=1,

            market="INTL"

        )


        db.session.add(transaction)



        db.session.commit()


        return user



    except Exception:


        db.session.rollback()

        raise





def check_credit_available(user):

    account = user.credit_account



    if not account:

        raise Exception(
            "Kein Credit-Konto vorhanden"
        )



    if account.balance_intl <= 0:

        raise Exception(
            "Keine verfügbaren Credits"
        )


    return True



def consume_credit(
    user,
    credit_type
):

    try:

        account = user.credit_account



        if not account:

            raise Exception(
                "Kein Credit-Konto vorhanden"
            )


        if account.balance_intl <= 0:

            raise Exception(
                "Keine verfügbaren Credits"
            )



        account.balance_intl -= 1



        transaction = CreditTransaction(

            user_id=user.id,

            type=credit_type,

            amount=-1,

            market="INTL"

        )


        db.session.add(transaction)



        db.session.commit()



    except Exception:


        db.session.rollback()

        raise


# ======================================================
# ADD PURCHASED CREDITS
# ======================================================

def add_credit(
    user_id,
    credits,
    credit_type
):


    try:


        account = CreditAccount.query.filter_by(
            user_id=user_id
        ).first()



        if not account:

            raise Exception(
                "Credit account not found"
            )



        account.balance_intl += credits



        transaction = CreditTransaction(

            user_id=user_id,

            type=credit_type,

            amount=credits,

            market="INTL"

        )



        db.session.add(transaction)



        db.session.commit()



        return True



    except Exception:


        db.session.rollback()

        raise


# ======================================================
# STRIPE CHECKOUT
# ======================================================

@app.route(
    "/stripe/create-checkout-session",
    methods=["POST"]
)
def create_checkout_session():

    try:

        # ==============================================
        # RECIBIR DATOS DEL FRONTEND
        # ==============================================

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({
                "error": "JSON body required"
            }), 400


        package_key = data.get(
            "package"
        )


        user_id = data.get(
            "user_id"
        )


        user_email = data.get(
            "user_email"
        )


        # ==============================================
        # VALIDAR PAQUETE
        # ==============================================

        if not package_key:

            return jsonify({
                "error": "Package required"
            }), 400


        package_key = (
            package_key
            .strip()
            .lower()
        )


        if package_key not in STRIPE_PRODUCTS_INTL:

            return jsonify({
                "error": "Invalid credit package"
            }), 400


        # ==============================================
        # VALIDAR USER ID
        # ==============================================

        if not user_id:

            return jsonify({
                "error": "User ID required"
            }), 400


        # ==============================================
        # BUSCAR USUARIO EN public.users
        # ==============================================

        user = User.query.filter_by(
            id=user_id
        ).first()


        if not user:

            return jsonify({
                "error": "User not found"
            }), 404


        # ==============================================
        # VALIDAR EMAIL SOLO SI EL FRONTEND LO ENVÍA
        # ==============================================

        if (
            user_email
            and user.email.lower()
            != user_email.strip().lower()
        ):

            return jsonify({
                "error": (
                    "User email does not match "
                    "the registered user"
                )
            }), 403


        # ==============================================
        # OBTENER CONFIGURACIÓN DEL PAQUETE
        # ==============================================

        product = STRIPE_PRODUCTS_INTL[
            package_key
        ]


        price_id = product.get(
            "price_id"
        )


        credits = product.get(
            "credits"
        )


        # ==============================================
        # VALIDAR PRICE ID
        # ==============================================

        if not price_id:

            return jsonify({
                "error": (
                    "Stripe Price ID not configured"
                )
            }), 500


        # ==============================================
        # VALIDAR CANTIDAD DE CRÉDITOS
        # ==============================================

        if not credits:

            return jsonify({
                "error": (
                    "Credit amount not configured"
                )
            }), 500


        # ==============================================
        # DEBUG LOCAL
        # ==============================================

        print(
            "========== STRIPE CHECKOUT =========="
        )

        print(
            "USER ID:",
            user.id
        )

        print(
            "USER EMAIL:",
            user.email
        )

        print(
            "PACKAGE:",
            package_key
        )

        print(
            "PRICE ID:",
            price_id
        )

        print(
            "CREDITS:",
            credits
        )

        print(
            "====================================="
        )


        # ==============================================
        # CREAR STRIPE CHECKOUT SESSION
        # ==============================================
        
        checkout_session = (
            stripe.checkout.Session.create(

                mode="payment",

                customer_email=user.email,


                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1
                    }
                ],    
                
                success_url=(
                    f"{STRIPE_SUCCESS_URL}?session_id={{CHECKOUT_SESSION_ID}}"
                ),

                cancel_url=(
                    STRIPE_CANCEL_URL
                ),

                metadata={

                    "user_id": str(
                        user.id
                    ),

                    "user_email": (
                        user.email
                    ),

                    "package": (
                        package_key
                    ),

                    "credits": str(
                        credits
                    )

                }

            )
        )


        # ==============================================
        # RESPUESTA AL FRONTEND
        # ==============================================

        return jsonify({

            "checkout_url": (
                checkout_session.url
            ),

            "session_id": (
                checkout_session.id
            )

        }), 200


    except stripe.error.StripeError as e:

        print(
            "STRIPE API ERROR:",
            str(e)
        )


        return jsonify({

            "error": (
                "Stripe Checkout could not "
                "be created"
            ),

            "details": str(e)

        }), 500


    except Exception as e:

        print(
            "STRIPE CHECKOUT ERROR:"
        )

        print(
            traceback.format_exc()
        )


        return jsonify({

            "error": str(e)

        }), 500

# ======================================================
# STRIPE WEBHOOK
# ======================================================


@app.route(
    "/stripe/webhook",
    methods=["POST"]
)
def stripe_webhook():


    payload = request.data


    sig_header = request.headers.get(
        "Stripe-Signature"
    )


    try:

        event = stripe.Webhook.construct_event(

            payload,

            sig_header,

            STRIPE_WEBHOOK_SECRET

        )



    except ValueError:


        return jsonify({

            "error": "Invalid payload"

        }),400



    except stripe.error.SignatureVerificationError:


        return jsonify({

            "error": "Invalid signature"

        }),400





    # ==================================================
    # PAYMENT SUCCESS
    # ==================================================


    if event["type"] == "checkout.session.completed":


        session = event["data"]["object"]


        metadata = session.metadata


        user_id = metadata["user_id"]


        credits_value = metadata["credits"]


        package = metadata["package"]



        if not user_id:


            return jsonify({

                "error":
                "Missing user_id metadata"

            }),400



        if not credits_value:


            return jsonify({

                "error":
                "Missing credits metadata"

            }),400



        credits = int(
            credits_value
        )



        print(
            "========== STRIPE PAYMENT =========="
        )


        print(
            "USER:",
            user_id
        )


        print(
            "PACKAGE:",
            package
        )


        print(
            "CREDITS:",
            credits
        )


        print(
            "===================================="
        )


        # ==================================================
        # UPDATE USER PLAN
        # ==================================================

        user = User.query.filter_by(
            id=user_id
        ).first()


        if user:

            user.current_plan = package.capitalize()

            db.session.commit()


            print(
                "PLAN UPDATED:",
                user.current_plan
            )


        else:

            print(
                "USER NOT FOUND FOR PLAN UPDATE:",
                user_id
            )


        # ==================================================
        # ADD CREDITS
        # ==================================================

        add_credit(

            user_id=user_id,

            credits=credits,

            credit_type=
            f"STRIPE_{package.upper()}"

        )



    return jsonify({

        "received": True

    }),200


# -------------------- Temporal Endpoint --------------------
@app.route("/test-db")
def test_db():

    try:
        from models import User

        users = User.query.all()

        return jsonify({
            "status": "ok",
            "users": len(users)
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# ======================================================
# REPORT MANAGEMENT
# ======================================================
       
def create_report_record(
    user,
    data,
    filename,
    pdf_path
):

    """
    Guarda historial del PDF generado.
    """

    anlage = data.get(
        "anlagendaten",
        {}
    )

    print("DEBUG ANLAGE:", anlage)


    # =====================================
    # CONVERTIR KWP A NUMERIC PARA POSTGRES
    # =====================================

    kwp_value = anlage.get("kwp")

    if kwp_value in ("", None):
        kwp_value = None
    else:
        kwp_value = float(kwp_value)

    print("============================")
    print("DEBUG create_report_record")
    print("filename:", filename)
    print("pdf_path recibido:", pdf_path)
    print("============================")

    report = Report(

        user_id=user.id,

        report_type="PDF_WERTGUTACHTEN",

        filename=filename,

        pdf_path=pdf_path,

        anlagenname=(
            anlage.get("name")
            or f"PV Anlage {anlage.get('plz', '')} {anlage.get('ort', '')}".strip()
            or "PV Anlage"
        ),

        kwp=kwp_value
    )

    print("============================")
    print("DEBUG objeto Report")
    print("report.pdf_path:", report.pdf_path)
    print("============================")

    db.session.add(report)


    try:

        db.session.commit()


    except Exception:

        db.session.rollback()
        raise


    return report


# ======================================================
# USER SYNCHRONIZATION
# Supabase Auth -> public.users -> credit_accounts
# ======================================================

@app.route("/users/sync", methods=["POST"])
def sync_user():

    data = request.get_json()

    supabase_user_id = data.get("user_id")
    email = data.get("email")


    if not supabase_user_id:
        return jsonify({
            "error": "User id required"
        }), 400


    if not email:
        return jsonify({
            "error": "Email required"
        }), 400


    try:

        user = create_user_if_not_exists(
            supabase_user_id=supabase_user_id,
            email=email,
            name=data.get("name"),
            company=data.get("company")
        )


        return jsonify({

            "id": str(user.id),

            "email": user.email,

            "current_plan": (
                user.current_plan
                if user.current_plan
                else "-"
            ),

            "balance": (
                user.credit_account.balance_intl
                if user.credit_account
                else 0
            )

        }), 200


    except Exception as e:

        print(
            "SYNC USER ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# SAFE TEXT
# ======================================================
def safe_text(text):
    if text is None:
        return ""
    replacements = {"€": " EUR", "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"}
    text = str(text)
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "ignore").decode("latin-1")

def clean_sach_name(raw):
    if not raw:
        return ""
    return re.split(r"[\\/|]", raw)[0].strip()

# ======================================================
# PDF FONTS
# ======================================================
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_PATH_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# ======================================================
# ROOT
# ======================================================
@app.route("/", methods=["GET"])
def index():
    return "PV-Wertgutachten Backend läuft korrekt"

# ======================================================
# ERTRAGSWERT
# ======================================================
@app.route("/ertragswert", methods=["POST"])
def ertragswert():
    try:
        data = request.get_json()

        k = float(data.get("anlagengroesse", 0))
        se = float(data.get("spezifischer_ertrag", 0))
        rl = int(data.get("restlaufzeit", 0))
        pr = float(data.get("performance_ratio", 100)) / 100
        degr = float(data.get("degradacion_anual", 0)) / 100
        opex = float(data.get("opex_anual", 0))

        raw_eigen = data.get("eigenverbrauch_anteil") or 0
        if isinstance(raw_eigen, str):
            raw_eigen = raw_eigen.replace("%", "").replace(",", ".").strip()

        try:
            eigenverbrauch_anteil = float(raw_eigen)
        except:
            eigenverbrauch_anteil = 0.0

        if eigenverbrauch_anteil < 0:
            eigenverbrauch_anteil = 0.0
        elif eigenverbrauch_anteil > 100:
            eigenverbrauch_anteil = 100.0

        batterie_verluste = float(data.get("batterie_verluste") or 0)

        netzeinspeisung = 100.0 - eigenverbrauch_anteil - batterie_verluste
        if netzeinspeisung < 0:
            netzeinspeisung = 0.0

        jahresertrag = k * se * pr

        total = 0
        current = jahresertrag

        for _ in range(rl):
            total += current - opex
            current *= (1 - degr)

        return jsonify({
            "ertragswert": total,
            "jahresertrag": jahresertrag,
            "eigenverbrauch_anteil": eigenverbrauch_anteil,
            "netzeinspeisung": netzeinspeisung,
            "batterie_verluste": batterie_verluste
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ======================================================
# PVGIS
# ======================================================
@app.route("/pvgis", methods=["POST"])
def pvgis():
    try:
        data = request.get_json()
        lat = float(data.get("lat"))
        lon = float(data.get("lon"))
        kwp = float(data.get("kwp"))

        url = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc"
        params = {
            "lat": lat,
            "lon": lon,
            "peakpower": kwp,
            "loss": 0,  #forzar pérdidas de 14% a "0" y considerar solo PR
            "outputformat": "json"
        }

        response = requests.get(url, params=params)
        data = response.json()
        annual = data["outputs"]["totals"]["fixed"]["E_y"]
        specific = annual / kwp

        return jsonify({
            "annual_production": annual,
            "specific_yield": specific
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ======================================================
# EEG LOGIC (GLOBAL - FIXED)
# ======================================================
def get_eeg_data(bm, kwp):
    try:
        kwp = float(kwp or 0)
    except:
        kwp = 0

    bm = (bm or "").lower().replace(" ", "")

    einspeiseverguetung = "-"
    eeg_periode = "Feb–Jul 2026"

    if "volleinspeisung" in bm and "teils" not in bm:
        if kwp <= 10:
            einspeiseverguetung = "12,34 ct/kWh"
        elif kwp <= 40:
            einspeiseverguetung = "10,35 ct/kWh"
        elif kwp <= 100:
            einspeiseverguetung = "10,35 ct/kWh"
        else:
            einspeiseverguetung = "Direktvermarktung (>100 kWp)"

    elif "eigenverbrauch" in bm or "batterie" in bm:
        if kwp <= 10:
            einspeiseverguetung = "7,78 (Teil) / 12,34 (Voll) ct/kWh"
        elif kwp <= 40:
            einspeiseverguetung = "6,73 (Teil) / 10,35 (Voll) ct/kWh"
        elif kwp <= 100:
            einspeiseverguetung = "5,50 (Teil) / 10,35 (Voll) ct/kWh"
        else:
            einspeiseverguetung = "Direktvermarktung"

    elif "mieterstrom" in bm:
        if kwp <= 10:
            einspeiseverguetung = "2,56 ct/kWh (Zuschlag)"
        elif kwp <= 40:
            einspeiseverguetung = "2,38 ct/kWh (Zuschlag)"
        elif kwp <= 100:
            einspeiseverguetung = "2,38 ct/kWh (Zuschlag)"
        else:
            einspeiseverguetung = "1,60 ct/kWh (Zuschlag)"

    elif "direktvermarktung" in bm:
        if kwp <= 10:
            einspeiseverguetung = "8,18 (Teil) / 12,74 (Voll) ct/kWh"
        elif kwp <= 40:
            einspeiseverguetung = "7,13 (Teil) / 10,75 (Voll) ct/kWh"
        elif kwp <= 100:
            einspeiseverguetung = "5,90 (Teil) / 10,75 (Voll) ct/kWh"
        elif kwp <= 400:
            einspeiseverguetung = "5,90 (Teil) / 8,94 (Voll) ct/kWh"
        else:
            einspeiseverguetung = "Marktpreis"

    return einspeiseverguetung, eeg_periode



# ======================================================
# PDF GUTACHTEN DIN 5008
# ======================================================
# ======================================================
# INTERNATIONAL PROFESSIONAL PV VALUATION REPORT
# ======================================================
@app.route("/pdf", methods=["POST"])
def pdf():

    try:

        data = request.get_json() or {}

        # ======================================================
        # USER / CREDIT VALIDATION
        # ======================================================

        email = data.get("user_email")
        supabase_user_id = data.get("user_id")

        if not email:
            return jsonify({"error": "User email required"}), 400

        if not supabase_user_id:
            return jsonify({"error": "Supabase user id required"}), 400

        user = create_user_if_not_exists(
            supabase_user_id=supabase_user_id,
            email=email,
            name=data.get("user_name"),
            company=data.get("company")
        )

        print("========== CREDIT DEBUG ==========")
        print("USER ID:", user.id)
        print("USER EMAIL:", user.email)

        account = CreditAccount.query.filter_by(user_id=user.id).first()
        print("CREDIT ACCOUNT:", account)
        if account:
            print("BALANCE INTL:", account.balance_intl)
        print("==================================")

        try:
            check_credit_available(user)
        except Exception as e:
            return jsonify({
                "error": str(e),
                "code": "NO_CREDITS"
            }), 402

        # ======================================================
        # DATA SOURCES
        # ======================================================

        sach = data.get("sachverstaendiger", {}) or {}
        ag = data.get("auftraggeber", {}) or {}
        anlage = data.get("anlagendaten", {}) or {}
        buch = data.get("buchwertData", {}) or {}
        ertrag = data.get("ertragswertData", {}) or {}
        rest = data.get("restwertData", {}) or {}
        pvgis = data.get("pvgisData", {}) or {}

        document_id = data.get("document_id") or f"PV-{datetime.date.today().year}-001"

        # ======================================================
        # SAFE NUMERIC HELPERS
        # ======================================================

        def num(value, default=0.0):
            try:
                if value is None or str(value).strip() == "":
                    return float(default)
                return float(str(value).replace(",", ".").replace("%", "").strip())
            except Exception:
                return float(default)

        def fmt_num(value, decimals=2):
            try:
                return f"{num(value):,.{decimals}f}"
            except Exception:
                return f"{0:.{decimals}f}"

        def usd(value):
            return f"${num(value):,.2f}"

        def pct(value, decimals=2):
            return f"{num(value):,.{decimals}f}%"

        def normalize_text(value):
            text = str(value or "").strip().lower()
            return (
                text.replace("ä", "ae")
                    .replace("ö", "oe")
                    .replace("ü", "ue")
                    .replace("ß", "ss")
            )

        def clean_display(value, fallback="-"):
            if value is None:
                return fallback
            text = str(value).strip()
            if not text:
                return fallback

            # Common German source values are translated here only for
            # presentation in the INTL PDF. Internal database values remain unchanged.
            normalized = normalize_text(text)
            generic_map = {
                "nichts": "None reported",
                "keine": "None reported",
                "keine probleme": "None reported",
                "keine bekannten probleme": "None reported",
                "keine angaben": "Not specified",
                "nicht angegeben": "Not specified",
                "unbekannt": "Not specified",
                "n.a.": "n.a.",
            }
            return generic_map.get(normalized, text)

        def translate_value(value, mapping, fallback="-"):
            text = clean_display(value, fallback)
            if text == fallback:
                return fallback
            normalized = normalize_text(text)
            return mapping.get(normalized, text)

        installation_type_map = {
            "schraegdach": "Pitched Roof",
            "schraeg dach": "Pitched Roof",
            "flachdach": "Flat Roof",
            "freiflaeche": "Ground-mounted",
            "freiflaechenanlage": "Ground-mounted",
            "bodenmontage": "Ground-mounted",
            "carport": "Carport",
            "fassade": "Facade",
        }

        module_technology_map = {
            "monokristallin": "Monocrystalline",
            "polykristallin": "Polycrystalline",
            "duennschicht": "Thin-film",
            "bifazial": "Bifacial",
        }

        inverter_type_map = {
            "stringwechselrichter": "String Inverter",
            "zentralwechselrichter": "Central Inverter",
            "modulwechselrichter": "Module Inverter",
            "mikrowechselrichter": "Microinverter",
            "hybridwechselrichter": "Hybrid Inverter",
            "inselwechselrichter": "Off-grid Inverter",
        }

        state_region_map = {
            "bayern": "Bavaria",
            "baden-wuerttemberg": "Baden-Württemberg",
            "baden-wurttemberg": "Baden-Württemberg",
            "berlin": "Berlin",
            "brandenburg": "Brandenburg",
            "bremen": "Bremen",
            "hamburg": "Hamburg",
            "hessen": "Hesse",
            "mecklenburg-vorpommern": "Mecklenburg-Western Pomerania",
            "niedersachsen": "Lower Saxony",
            "nordrhein-westfalen": "North Rhine-Westphalia",
            "rheinland-pfalz": "Rhineland-Palatinate",
            "saarland": "Saarland",
            "sachsen": "Saxony",
            "sachsen-anhalt": "Saxony-Anhalt",
            "schleswig-holstein": "Schleswig-Holstein",
            "thueringen": "Thuringia",
            "thüringen": "Thuringia",
        }

        def english_name(value, fallback=""):
            text = str(value or "").strip()
            if not text:
                return fallback
            normalized = normalize_text(text)
            if normalized.startswith("herr "):
                return "Mr. " + text[5:].strip()
            if normalized.startswith("frau "):
                return "Ms. " + text[5:].strip()
            return text

        def english_salutation(value):
            name = str(value or "").strip()
            if not name:
                return "Dear Sir or Madam,"
            normalized = normalize_text(name)
            if normalized.startswith("herr "):
                return f"Dear Mr. {name[5:].strip()},"
            if normalized.startswith("frau "):
                return f"Dear Ms. {name[5:].strip()},"
            return f"Dear {name},"

        def yes_no(value):
            if isinstance(value, bool):
                return "Yes" if value else "No"
            text = str(value or "").strip().lower()
            if text in {"ja", "yes", "true", "1"}:
                return "Yes"
            if text in {"nein", "no", "false", "0"}:
                return "No"
            return clean_display(value)

        def condition_label(value):
            mapping = {
                "sehr gut": "Very Good",
                "gut": "Good",
                "durchschnittlich": "Average",
                "mittel": "Average",
                "schlecht": "Poor",
                "poor": "Poor",
                "good": "Good",
                "average": "Average",
                "very good": "Very Good",
                "ausgezeichnet": "Excellent",
                "excellent": "Excellent",
            }
            return mapping.get(str(value or "").strip().lower(), clean_display(value, "Not specified"))

        def operating_model_label(value):
            raw = str(value or "").strip().lower()
            normalized = (
                raw.replace(" ", "")
                .replace("/", "")
                .replace("+", "")
                .replace("ä", "ae")
                .replace("ö", "oe")
                .replace("ü", "ue")
            )
            mapping = {
                "volleinspeisung": "Full Grid Export (100%)",
                "eigenverbrauch": "Self-consumption + Grid Export",
                "eigenverbrauch_batterie": "Self-consumption + Battery (BESS)",
                "mieterstrom": "Tenant Electricity Model",
                "direktvermarktung": "Direct Marketing",
            }
            return mapping.get(normalized, clean_display(value, "Not specified"))

        def write_line(label, value, bold_label=False):
            if bold_label:
                pdf.set_font("DejaVu", "B", 10)
                pdf.write(6, f"{label}: ")
                pdf.set_font("DejaVu", "", 10)
                pdf.write(6, clean_display(value))
                pdf.ln(6)
            else:
                pdf.cell(0, 6, f"- {label}: {clean_display(value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # ======================================================
        # LCOE / CORE CALCULATION DATA
        # ======================================================

        pr_input = num(ertrag.get("performance_ratio"), 100.0)
        capex = num(buch.get("anschaffung"), 0.0)
        opex_anual = num(ertrag.get("opex"), 0.0)
        restlaufzeit = num(ertrag.get("restlaufzeit"), 0.0)

        jahresproduktion = num(
            ertrag.get("production")
            or ertrag.get("jahresertrag")
            or pvgis.get("production")
            or pvgis.get("annual_production"),
            0.0
        )

        total_costs = capex + (opex_anual * restlaufzeit)
        total_energy = jahresproduktion * restlaufzeit
        lcoe = total_costs / total_energy if total_energy > 0 else 0.0

        # ======================================================
        # RESULT VALUES
        # ======================================================

        npv = num(ertrag.get("npv"), 0.0)
        irr = num(ertrag.get("irr"), 0.0)
        payback = ertrag.get("payback")

        book_value = num(buch.get("buchwert"), 0.0)
        annual_depreciation = num(buch.get("abschreibungJahr"), 0.0)
        accumulated_depreciation = num(buch.get("abschreibung"), 0.0)
        asset_age = num(buch.get("alter"), 0.0)
        asset_lifetime = num(buch.get("lebensdauer"), 0.0)

        pv_economic_value = num(
            ertrag.get("ertragswertKumuliert")
            or ertrag.get("ertragswert")
            or ertrag.get("cumulativeEconomicValue"),
            0.0
        )

        annual_gross_revenue = num(
            ertrag.get("jahresertrag")
            or ertrag.get("annualGrossRevenue"),
            0.0
        )

        average_annual_net_value = num(
            ertrag.get("ertragswertJahr")
            or ertrag.get("annualNetValue"),
            0.0
        )
        if average_annual_net_value == 0 and restlaufzeit > 0 and pv_economic_value != 0:
            average_annual_net_value = pv_economic_value / restlaufzeit

        residual_value = num(rest.get("restwert"), 0.0)
        future_earnings = num(rest.get("zukuenftige_gewinne"), 0.0)
        cost_discount = num(rest.get("kostenabschlag"), 0.0)
        sale_discount = num(rest.get("verkaufsabschlag"), 0.0)
        market_factor = num(rest.get("marktfaktor"), 100.0)

        # ======================================================
        # PRODUCTION / LOCATION DATA
        # ======================================================

        production = (
            ertrag.get("production")
            or ertrag.get("jahresertrag")
            or pvgis.get("production")
            or pvgis.get("annual_production")
            or data.get("production")
        )

        production_value = num(production, 0.0)
        specific_yield = num(
            ertrag.get("spezifischer_ertrag")
            or pvgis.get("specific_yield")
            or pvgis.get("specificYield"),
            0.0
        )

        if specific_yield == 0 and num(anlage.get("kwp"), 0) > 0 and production_value > 0:
            specific_yield = production_value / num(anlage.get("kwp"), 1)

        latitude = num(anlage.get("breitengrad"), 0.0)
        longitude = num(anlage.get("langengrad"), 0.0)

        # ======================================================
        # OPERATING MODEL / SELF-CONSUMPTION
        # ======================================================

        operating_model_raw = (
            anlage.get("betriebsmodell")
            or ertrag.get("betriebsmodell")
            or data.get("betriebsmodell")
        )
        operating_model = operating_model_label(operating_model_raw)

        eigen = num(ertrag.get("eigenverbrauch_anteil"), 0.0)
        if eigen <= 1:
            eigen *= 100
        eigen = max(0.0, min(eigen, 100.0))

        if str(operating_model_raw or "").strip().lower() == "volleinspeisung":
            eigen = 0.0

        battery_losses = num(ertrag.get("batterie_verluste"), 0.0)
        battery_losses = max(0.0, min(battery_losses, 100.0))
        grid_export_share = max(0.0, 100.0 - eigen - battery_losses)

        # ======================================================
        # PDF CLASS
        # ======================================================

        class MyPDF(FPDF):
            # Keep the cursor at the left margin after every multi_cell.
            # This prevents FPDF2 errors when width=0 is used after another multi_cell.
            def multi_cell(self, *args, **kwargs):
                # FPDF2 keeps the cursor at the right edge after multi_cell()
                # unless new_x/new_y are specified. Always return to the left
                # margin so a following multi_cell(width=0) has usable width.
                kwargs.setdefault("new_x", XPos.LMARGIN)
                kwargs.setdefault("new_y", YPos.NEXT)
                return super().multi_cell(*args, **kwargs)

            def header(self):
                if getattr(self, "is_cover", False):
                    return
                self.set_y(10)
                self.set_font("DejaVu", "B", 15)
                self.cell(
                    0,
                    8,
                    "PV-VALUATION REPORT",
                    new_x=XPos.LMARGIN,
                    new_y=YPos.NEXT,
                    align="L"
                )

            def footer(self):
                if getattr(self, "is_cover", False):
                    return

                self.set_draw_color(200, 200, 200)
                self.line(self.l_margin, 20, self.w - self.r_margin, 20)

                if self.page_no() > 1:
                    analyst = getattr(self, "sachverstaendiger", {}) or {}
                    firm = clean_sach_name(
                        analyst.get("firma") or analyst.get("name") or ""
                    )
                    address = analyst.get("adresse", "")
                    city = analyst.get("plz_ort", "")
                    website = analyst.get("website", "")
                    email_value = analyst.get("email", "")

                    self.set_y(-20)
                    self.set_font("DejaVu", "", 8)
                    self.set_text_color(120, 120, 120)

                    line = " · ".join(
                        [
                            str(x).strip()
                            for x in [firm, address, city, website, email_value]
                            if str(x).strip()
                        ]
                    )
                    if line:
                        self.multi_cell(0, 4, line, align="C")

                self.set_y(-10)
                self.set_font("DejaVu", "", 8)
                self.cell(
                    0,
                    6,
                    f"Page {self.page_no()} of {{nb}}",
                    align="C"
                )

        pdf = MyPDF()
        pdf.sachverstaendiger = sach
        pdf.is_cover = True

        pdf.add_font("DejaVu", "", FONT_PATH, uni=True)
        pdf.add_font("DejaVu", "B", FONT_PATH_BOLD, uni=True)

        pdf.set_auto_page_break(auto=True, margin=20)
        pdf.set_left_margin(20)
        pdf.set_right_margin(20)

        # ======================================================
        # COVER PAGE
        # ======================================================

        pdf.add_page()
        pdf.set_font("DejaVu", "", 11)

        pdf.set_font("DejaVu", "B", 20)
        pdf.cell(
            0,
            10,
            "Professional PV Valuation Report",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
            align="C"
        )
        pdf.ln(4)

        pdf.set_font("DejaVu", "", 14)
        pdf.cell(
            0,
            8,
            "Technical and Financial Analysis of a Photovoltaic System",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
            align="C"
        )
        pdf.ln(10)

        logo = sach.get("logo")
        logo_path = None
        if logo:
            try:
                if "," in logo:
                    logo = logo.split(",", 1)[1]
                img_data = base64.b64decode(logo)
                logo_path = os.path.join(TEMP_DIR, f"logo_{uuid.uuid4().hex}.png")
                with open(logo_path, "wb") as f:
                    f.write(img_data)
                pdf.image(logo_path, x=pdf.l_margin, y=40, w=25)
            except Exception as e:
                print("Logo error:", e)

        pdf.set_y(85)
        pdf.set_font("DejaVu", "B", 11)
        analyst_name = english_name(sach.get("name") or sach.get("firma") or "")
        if analyst_name:
            pdf.cell(0, 6, analyst_name, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)
        for value in [sach.get("adresse", ""), sach.get("plz_ort", "")]:
            if str(value).strip():
                pdf.cell(0, 6, str(value).strip(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if sach.get("phone"):
            pdf.cell(0, 6, f"Phone: {sach.get('phone')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if sach.get("email"):
            pdf.cell(0, 6, f"Email: {sach.get('email')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if sach.get("website"):
            pdf.cell(0, 6, f"Web: {sach.get('website')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(12)

        if ag.get("name"):
            pdf.set_font("DejaVu", "B", 11)
            pdf.cell(0, 6, english_name(ag.get("name")), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("DejaVu", "", 10)
            for value in [ag.get("adresse", ""), ag.get("plz_ort", "")]:
                if str(value).strip():
                    pdf.cell(0, 6, str(value).strip(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(10)

        datum = datetime.date.today().strftime("%B %d, %Y")
        analyst_city = str(sach.get("ort") or sach.get("city") or "").strip()
        if not analyst_city:
            raw_plz_ort = str(sach.get("plz_ort") or "").strip()
            if re.match(r"^\s*\d{4,10}\s+", raw_plz_ort):
                analyst_city = re.sub(r"^\s*\d{4,10}\s+", "", raw_plz_ort).strip()
            else:
                analyst_city = raw_plz_ort

        location_date = f"{analyst_city}, {datum}" if analyst_city else datum
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, location_date, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        pdf.ln(8)

        pdf.set_draw_color(180, 180, 180)
        y_line = pdf.get_y()
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(6)

        system_location = ", ".join(
            [
                str(anlage.get("adresse", "")).strip(),
                str(anlage.get("plz", "")).strip(),
                str(anlage.get("ort", "")).strip(),
                translate_value(anlage.get("bundesland", ""), state_region_map, ""),
            ]
        ).replace(", ,", ",").strip(" ,")

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "PV Valuation Analysis of the Photovoltaic System", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if system_location:
            pdf.set_font("DejaVu", "", 10)
            pdf.multi_cell(0, 6, f"at the location {system_location}", align="L")

        pdf.ln(8)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, english_salutation(ag.get("name")), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(6)

        pdf.multi_cell(
            0,
            6,
            "Please find attached the professional valuation report for the photovoltaic system referred to above. The report contains the technical, economic and valuation-related information generated from the data and assumptions entered into PV-Valuator.",
            align="L"
        )

        pdf.ln(8)
        pdf.cell(0, 6, "Sincerely,", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        cover_signature_path = None
        signature = sach.get("signature")
        if signature:
            try:
                if "," in signature:
                    signature = signature.split(",", 1)[1]
                sig_data = base64.b64decode(signature)
                cover_signature_path = os.path.join(TEMP_DIR, f"cover_signature_{uuid.uuid4().hex}.png")
                with open(cover_signature_path, "wb") as f:
                    f.write(sig_data)
                pdf.image(cover_signature_path, x=pdf.l_margin, y=pdf.get_y(), h=25)
                pdf.set_y(pdf.get_y() + 25)
            except Exception as e:
                print("Cover signature error:", e)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, analyst_name, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if cover_signature_path and os.path.exists(cover_signature_path):
            os.remove(cover_signature_path)

        # ======================================================
        # SUMMARY / OVERALL ASSESSMENT
        # ======================================================

        pdf.is_cover = False
        pdf.add_page()
        pdf.ln(10)

        # Keep the original German rating logic and visual color coding,
        # translated for the international report. This preserves the
        # assessment functionality without changing any calculation.
        if npv > 5000 and irr >= 8:
            rating = "A – Highly Economically Viable"
            rating_color = (46, 125, 50)
        elif npv > 0 and irr >= 5:
            rating = "B – Economically Viable"
            rating_color = (85, 139, 47)
        elif npv > -5000:
            rating = "C – Limited Economic Viability"
            rating_color = (249, 168, 37)
        else:
            rating = "D – Critical Economic Viability"
            rating_color = (198, 40, 40)

        payback_numeric = None
        try:
            if payback not in [None, "", "-"] and str(payback).strip().lower() not in {"n.a.", "na", "n/a"}:
                payback_numeric = num(payback, 0)
        except Exception:
            payback_numeric = None

        pdf.set_font("DejaVu", "B", 18)
        pdf.cell(
            0,
            10,
            "Executive Summary",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
            align="C"
        )
        pdf.ln(8)

        # Overall assessment banner – same visual treatment as the German PDF.
        assessment_width = 160
        assessment_x = (pdf.w - assessment_width) / 2
        pdf.set_x(assessment_x)
        pdf.set_fill_color(*rating_color)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("DejaVu", "B", 14)
        pdf.cell(
            assessment_width,
            12,
            f"Overall Assessment: {rating}",
            border=0,
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
            align="C",
            fill=True
        )
        pdf.set_text_color(0, 0, 0)
        pdf.ln(10)

        # Preserve the full assessment table from the German version,
        # translated into English and retaining the same information level.
        economic_assessment = "Limited" if npv < 0 else "Economically Viable"
        return_assessment = "Low–Moderate" if irr < 5 else "Good"

        summary_rows = [
            ("Economic Performance", economic_assessment),
            ("Technical Condition", condition_label(anlage.get("zustand") or "Gut")),
            ("Investment Risk", "Moderate"),
            ("Return Potential", return_assessment),
            ("Payback Period", f"{fmt_num(payback_numeric, 0)} years" if payback_numeric is not None else "n.a."),
            ("Net Present Value (NPV)", usd(npv)),
            ("Internal Rate of Return (IRR)", pct(irr)),
            ("Residual Value", usd(residual_value)),
        ]

        col_width_1 = 80
        col_width_2 = 80
        total = col_width_1 + col_width_2
        start_x = (pdf.w - total) / 2

        pdf.set_x(start_x)
        pdf.set_font("DejaVu", "B", 11)
        pdf.set_fill_color(220, 230, 241)
        pdf.cell(col_width_1, 8, "Metric", border=1, fill=True, align="C")
        pdf.cell(
            col_width_2,
            8,
            "Assessment / Result",
            border=1,
            fill=True,
            align="C",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT
        )

        pdf.set_font("DejaVu", "", 10)
        for left, right in summary_rows:
            pdf.set_x(start_x)
            pdf.cell(col_width_1, 8, str(left), border=1, align="L")
            pdf.cell(
                col_width_2,
                8,
                str(right),
                border=1,
                align="C",
                new_x=XPos.LMARGIN,
                new_y=YPos.NEXT
            )

        pdf.ln(10)

        # Preserve the professional interpretive section while avoiding the
        # German-specific legal/regulatory wording removed from the INTL report.
        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(0, 8, "Assessment Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)
        pdf.set_font("DejaVu", "", 10)

        if npv > 0:
            summary_note = (
                "The photovoltaic system shows a positive economic result under the selected assumptions, "
                "with a positive NPV at the selected discount rate and identifiable revenue potential over the remaining lifetime."
            )
        elif npv < 0:
            summary_note = (
                "The photovoltaic system shows a limited economic result under the selected assumptions, "
                "with a negative NPV at the selected discount rate. The modeled result is sensitive to the assumptions used."
            )
        else:
            summary_note = (
                "The photovoltaic system shows an approximately neutral economic result under the selected assumptions, "
                "with an NPV close to zero at the selected discount rate."
            )

        pdf.multi_cell(0, 6, summary_note, align="L")

        pdf.ln(6)
        pdf.set_font("DejaVu", "", 9)
        pdf.multi_cell(
            0,
            5,
            "The assessment reflects the assumptions and inputs used for this analysis. Users should interpret the results in the context of the technical condition, production assumptions, electricity prices, operating costs, remaining lifetime and discount rate of the specific system. No country-specific tax, accounting or regulatory conclusion is implied.",
            align="L"
        )

        # ======================================================
        # 1. CLIENT / ORDERING PARTY
        # ======================================================

        pdf.add_page()
        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "1. CLIENT / ORDERING PARTY", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, clean_display(ag.get("name")), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if ag.get("adresse"):
            pdf.cell(0, 6, str(ag.get("adresse")), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if ag.get("plz_ort"):
            pdf.cell(0, 6, str(ag.get("plz_ort")), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if ag.get("telefon"):
            pdf.cell(0, 6, f"Phone: {ag.get('telefon')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if ag.get("email"):
            pdf.cell(0, 6, f"Email: {ag.get('email')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(8)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "2. PREPARED BY", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)
        pdf.set_font("DejaVu", "", 10)
        for value in [
            sach.get("name", ""),
            sach.get("firma", ""),
            sach.get("adresse", ""),
            sach.get("plz_ort", ""),
        ]:
            if str(value).strip():
                pdf.cell(0, 6, str(value).strip(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if sach.get("phone"):
            pdf.cell(0, 6, f"Phone: {sach.get('phone')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if sach.get("email"):
            pdf.cell(0, 6, f"Email: {sach.get('email')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if sach.get("website"):
            pdf.cell(0, 6, f"Web: {sach.get('website')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(8)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "3. PV SYSTEM", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        installation_type = translate_value(anlage.get("installationsart"), installation_type_map, "Not specified")
        system_text = (
            f"Photovoltaic system - Installation type: {installation_type}"
        )
        pdf.multi_cell(0, 6, system_text, align="L")

        pdf.ln(6)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "4. LOCATION", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        location_parts = [
            anlage.get("adresse", ""),
            anlage.get("plz", ""),
            anlage.get("ort", ""),
            translate_value(anlage.get("bundesland", ""), state_region_map, ""),
        ]
        location_text = ", ".join(str(x).strip() for x in location_parts if str(x).strip())
        pdf.multi_cell(0, 6, location_text or "Not specified", align="L")

        # ======================================================
        # 5. VALUATION OBJECTIVE
        # ======================================================

        pdf.ln(8)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "5. VALUATION OBJECTIVE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(
            0,
            6,
            "The objective of the analysis is to estimate the technical and economic characteristics of the photovoltaic system and to quantify selected valuation and financial indicators based on the supplied assumptions.",
            align="L"
        )

        # ======================================================
        # 6. INTENDED USE
        # ======================================================

        pdf.ln(8)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "6. INTENDED USE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(
            0,
            6,
            "This report is intended as a decision-support document for photovoltaic project, investment and asset-value analysis. It is not a country-specific tax, accounting, legal or regulatory assessment.",
            align="L"
        )

        # ======================================================
        # 7. LOCATION DATA
        # ======================================================

        pdf.add_page()
        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "7. LOCATION DATA", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"- City: {clean_display(anlage.get('ort'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- State / Region: {translate_value(anlage.get('bundesland'), state_region_map)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Latitude: {latitude:.4f}°" if latitude else "- Latitude: Not specified", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Longitude: {longitude:.4f}°" if longitude else "- Longitude: Not specified", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(9)

        # ======================================================
        # 8. SYSTEM DATA
        # ======================================================

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "8. SYSTEM DATA", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"- System Size: {fmt_num(anlage.get('kwp'))} kWp", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Installation Type: {translate_value(anlage.get('installationsart'), installation_type_map)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Module Technology: {translate_value(anlage.get('modultyp'), module_technology_map)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Tilt / Roof Angle: {fmt_num(anlage.get('dachneigung'))}°", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Orientation / Azimuth: {fmt_num(anlage.get('azimut'))}°", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Performance Ratio (PR): {pct(pr_input, 2)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Specific Yield: {fmt_num(specific_yield)} kWh/kWp/year", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- PVGIS Annual Production: {fmt_num(production_value)} kWh/year" if production_value else "- PVGIS Annual Production: Not specified", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Installation Date: {clean_display(anlage.get('inbetriebnahme'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Remaining Lifetime: {fmt_num(restlaufzeit, 1)} years", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Annual Degradation: {pct(ertrag.get('degradation'), 2)} / year", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(9)

        # ======================================================
        # 9. TECHNICAL DETAILS
        # ======================================================

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "9. TECHNICAL DETAILS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        module_model = f"{anlage.get('modulhersteller', '')} {anlage.get('modellmodule', '')}".strip()
        inverter_model = f"{anlage.get('wrhersteller', '')} {anlage.get('wrmodell', '')}".strip()
        inverter_type = anlage.get("wechselrichtertyp") or anlage.get("wrtyp") or ""

        pdf.cell(0, 6, f"- Module Model: {clean_display(module_model)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Inverter Model: {clean_display(inverter_model)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Inverter Type: {translate_value(inverter_type, inverter_type_map)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Inverter Installation Year: {clean_display(anlage.get('wrinstallationsjahr'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Inverter Replaced: {yes_no(anlage.get('wraustausch'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Last Maintenance: {clean_display(anlage.get('letztewartung'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Maintenance Contract: {yes_no(anlage.get('wartungsvertrag'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Known Issues: {clean_display(anlage.get('probleme'), 'None reported')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # ======================================================
        # 10. OPERATING MODEL
        # ======================================================

        pdf.ln(9)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "10. OPERATING MODEL", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        models = [
            ("volleinspeisung", "Full Grid Export (100%)"),
            ("eigenverbrauch", "Self-consumption + Grid Export"),
            ("eigenverbrauch_batterie", "Self-consumption + Battery (BESS)"),
        ]

        normalized_model = str(operating_model_raw or "").strip().lower()
        for key, label in models:
            selected = normalized_model == key
            symbol = "☑" if selected else "☐"
            pdf.cell(0, 6, f"{symbol} {label}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.cell(0, 6, f"- Selected model: {operating_model}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Self-consumption share: {pct(eigen, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Battery losses: {pct(battery_losses, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Estimated grid export share: {pct(grid_export_share, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # ======================================================
        # OPTIONAL SELF-CONSUMPTION CHART
        # ======================================================
        pdf.add_page()
        pdf.ln(10)

        pie_chart_path = None
        show_pie_chart = normalized_model in ["eigenverbrauch", "eigenverbrauch_batterie"]

        if show_pie_chart and (eigen + grid_export_share) > 0:
            try:
                pie_chart_path = os.path.join(
                    TEMP_DIR,
                    f"piechart_{uuid.uuid4().hex}.png"
                )

                labels = [
                    f"Self-consumption\n{eigen:.1f}%",
                    f"Grid export\n{grid_export_share:.1f}%"
                ]
                sizes = [eigen, grid_export_share]

                plt.figure(figsize=(3.5, 3.5))
                plt.pie(sizes, labels=labels, autopct="%1.1f%%", startangle=90)
                plt.title("Self-consumption vs. Grid Export", fontweight="bold")
                plt.axis("equal")
                plt.savefig(pie_chart_path, bbox_inches="tight", transparent=False)
                plt.close("all")
                gc.collect()

                if os.path.exists(pie_chart_path):
                    pdf.ln(5)
                    img_width = 90
                    page_width = pdf.w - pdf.l_margin - pdf.r_margin
                    x_center = pdf.l_margin + (page_width - img_width) / 2
                    pdf.image(pie_chart_path, x=x_center, w=img_width)
                    pdf.ln(5)
            except Exception as e:
                print("Self-consumption chart error:", e)
                pie_chart_path = None

        # ======================================================
        # 11. FINANCIAL ASSUMPTIONS
        # ======================================================

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "11. FINANCIAL ASSUMPTIONS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        export_price = num(ertrag.get("einspeiseverguetung"), 0.0)
        electricity_value = num(ertrag.get("strompreis"), 0.0)
        discount_rate = num(ertrag.get("diskontsatz"), 0.0)

        pdf.cell(0, 6, f"- Initial Investment / CAPEX: {usd(capex)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Annual Operating Costs / OPEX: {usd(opex_anual)} / year", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Electricity Value / Retail Electricity Price: ${electricity_value:,.4f} / kWh", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Grid Export Price: ${export_price:,.4f} / kWh", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Discount Rate / WACC: {pct(discount_rate)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Annual Degradation: {pct(ertrag.get('degradation'), 2)} / year", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Currency: USD", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # ======================================================
        # 12. VALUATION METHODOLOGY
        # ======================================================

        pdf.ln(6)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "12. VALUATION METHODOLOGY", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(
            0,
            6,
            "The report combines an indicative depreciated asset value, a PV economic value calculation and selected financial indicators. The calculations use the technical, production and financial assumptions entered in the application.",
            align="L"
        )
        pdf.ln(3)
        pdf.multi_cell(
            0,
            6,
            "The Depreciated Asset Value is calculated from the initial investment, asset age, expected lifetime and selected depreciation method. It is an indicative analytical value and is not intended to represent a country-specific tax or accounting value.",
            align="L"
        )
        pdf.ln(3)
        pdf.multi_cell(
            0,
            6,
            "The PV Economic Value is based on projected economic value over the remaining lifetime. NPV, IRR and payback are derived from the financial cash-flow assumptions supplied to the application.",
            align="L"
        )

        # ======================================================
        # 13. LIMITATIONS
        # ======================================================

        pdf.ln(6)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "13. LIMITATIONS OF THE ANALYSIS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(
            0,
            6,
            "The analysis is model-based and depends on the quality and completeness of the supplied information. Actual production, electricity prices, operating costs, financing conditions, equipment condition, degradation and future market conditions may differ from the assumptions used.",
            align="L"
        )
        pdf.ln(3)
        pdf.multi_cell(
            0,
            6,
            "PVGIS data, where available, are used as a solar-resource and production reference. They do not constitute a guarantee of future system production.",
            align="L"
        )

        # ======================================================
        # 14. ASSUMPTIONS
        # ======================================================

        pdf.add_page()
        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "14. ASSUMPTIONS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(
            0,
            6,
            "The following assumptions are relevant to the calculation unless explicitly changed by the user:",
            align="L"
        )
        for assumption in [
            "The supplied system parameters are representative of the photovoltaic system being analyzed.",
            f"Annual degradation is assumed at {pct(ertrag.get('degradation'), 2)}.",
            "Annual operating costs are represented by the OPEX input and are not automatically adjusted for inflation unless the model specifies otherwise.",
            "No country-specific tax, accounting or regulatory treatment is applied in the international report.",
            "No extraordinary repair event is automatically assumed unless reflected in the user inputs.",
        ]:
            pdf.multi_cell(0, 6, f"- {assumption}", align="L")

        pdf.ln(9)
        # ======================================================
        # 15. VALUATION DATA
        # ======================================================

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "15. VALUATION DATA", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        pdf.cell(0, 6, f"- Initial Investment / CAPEX: {usd(capex)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Asset Age: {fmt_num(asset_age, 1)} years", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Expected Asset Lifetime: {fmt_num(asset_lifetime, 1)} years", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        depreciation_method_raw = str(buch.get("methode") or "linear").strip().lower()
        depreciation_method = "Straight-line" if depreciation_method_raw in {"linear", "straight-line", "straight line"} else "Declining-balance"
        pdf.cell(0, 6, f"- Depreciation Method: {depreciation_method}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Annual Depreciation: {usd(annual_depreciation)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Accumulated Depreciation: {usd(accumulated_depreciation)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Depreciated Asset Value: {usd(book_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Annual Gross Revenue: {usd(annual_gross_revenue)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Average Annual Net Economic Value: {usd(average_annual_net_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- PV Economic Value, cumulative: {usd(pv_economic_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Future Earnings Used for Residual Value: {usd(future_earnings)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Cost Discount: {pct(cost_discount, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Sale Discount: {pct(sale_discount, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Residual Value: {usd(residual_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Market Factor Input: {pct(market_factor, 0)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # ======================================================
        # 16. CASH FLOW ANALYSIS
        # ======================================================
        pdf.add_page()
        pdf.ln(10)

        cashflows = ertrag.get("cashflows", []) or []
        chart_path = None

        if cashflows and len(cashflows) > 1:
            try:
                values = [num(v, 0) for v in cashflows[1:]]
                years = list(range(1, len(values) + 1))

                chart_path = os.path.join(
                    TEMP_DIR,
                    f"cashflow_{uuid.uuid4().hex}.png"
                )

                plt.figure(figsize=(8, 4))
                plt.plot(years, values, marker="o")
                plt.xlabel("Year")
                plt.ylabel("Net Cash Flow (USD)")
                plt.title("Cash Flow Development")
                plt.grid(True)
                plt.axhline(0, linestyle="--")
                plt.savefig(chart_path, bbox_inches="tight")
                plt.close("all")
                gc.collect()
            except Exception as e:
                print("Cash flow chart error:", e)
                chart_path = None

        if len(cashflows) > 1:
            pdf.ln(8)
            pdf.set_font("DejaVu", "B", 11)
            pdf.cell(0, 8, "16. CASH FLOW ANALYSIS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(4)

            pdf.set_font("DejaVu", "", 10)
            pdf.multi_cell(
                0,
                6,
                "Detailed annual cash flow development based on the modeled assumptions. Year 0, if present, represents the initial investment and is not repeated in the annual operating table.",
                align="L"
            )
            pdf.ln(4)

            # Same colored section indicator used by the German PDF.
            cashflow_band_width = 169
            cashflow_band_x = (pdf.w - cashflow_band_width) / 2
            pdf.set_x(cashflow_band_x)
            pdf.set_fill_color(*rating_color)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font("DejaVu", "B", 12)
            pdf.cell(
                cashflow_band_width,
                10,
                "Detailed Cash Flow Development",
                border=0,
                new_x=XPos.LMARGIN,
                new_y=YPos.NEXT,
                align="C",
                fill=True
            )
            pdf.set_text_color(0, 0, 0)
            pdf.ln(4)

            col_year = 40
            col_value = 129
            pdf.set_font("DejaVu", "B", 11)
            pdf.set_fill_color(220, 230, 241)
            pdf.cell(col_year, 8, "Year", border=1, fill=True, align="C")
            pdf.cell(col_value, 8, "Net Cash Flow", border=1, fill=True, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            pdf.set_font("DejaVu", "", 10)
            for i in range(1, min(21, len(cashflows))):
                fill_row = i % 2 == 0
                if fill_row:
                    pdf.set_fill_color(245, 245, 245)
                else:
                    pdf.set_fill_color(255, 255, 255)
                pdf.cell(col_year, 7, f"Year {i}", border=1, fill=True, align="C")
                pdf.cell(
                    col_value,
                    7,
                    usd(cashflows[i]),
                    border=1,
                    fill=True,
                    align="C",
                    new_x=XPos.LMARGIN,
                    new_y=YPos.NEXT
                )

            pdf.ln(10)
         

            if chart_path and os.path.exists(chart_path):
                pdf.ln(10)
                pdf.add_page()
                pdf.ln(10)
                img_width = 170
                page_width = pdf.w - pdf.l_margin - pdf.r_margin
                x_center = pdf.l_margin + (page_width - img_width) / 2
                pdf.image(chart_path, x=x_center, w=img_width)

        # ======================================================
        # 17. ANALYSIS RESULTS
        # ======================================================

        
        pdf.ln(5)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "17. FINANCIAL ANALYSIS RESULTS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        pdf.cell(0, 6, f"- Cost Deduction: {pct(cost_discount, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Sales Deduction: {pct(sale_discount, 1)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Net Present Value (NPV): {usd(npv)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Internal Rate of Return (IRR): {pct(irr)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        try:
            roi = ((pv_economic_value - capex) / capex) * 100 if capex else 0.0
        except Exception:
            roi = 0.0

        pdf.cell(0, 6, f"- Return on Investment (ROI): {pct(roi)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if payback_numeric is not None:
            pdf.cell(0, 6, f"- Payback Period: {fmt_num(payback_numeric, 0)} years", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        else:
            pdf.cell(0, 6, "- Payback Period: n.a.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.cell(0, 6, f"- Indicative LCOE: ${lcoe:,.4f} / kWh", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Depreciated Asset Value: {usd(book_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- PV Economic Value (Cumulative): {usd(pv_economic_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Future Earnings: {usd(future_earnings)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        maintenance_raw = rest.get("wartung", False)
        if isinstance(maintenance_raw, str):
            maintenance_effect = 15.0 if maintenance_raw.strip().lower() in {"true", "1", "yes", "ja"} else 0.0
        else:
            maintenance_effect = 15.0 if bool(maintenance_raw) else 0.0

        pdf.cell(0, 6, f"- Maintenance Effect: +{maintenance_effect:.1f}%", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Residual Value: {usd(residual_value)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        market_label = "Normal"
        if market_factor < 100:
            market_label = "Weak"
        elif market_factor > 100:
            market_label = "Strong"

        pdf.cell(0, 6, f"- Market Factor: {fmt_num(market_factor, 0)}% ({market_label})", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- System Condition: {condition_label(rest.get('zustand_label') or rest.get('zustand') or anlage.get('zustand'))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "18. INTERPRETATION OF RESULTS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        if npv > 0:
            interpretation = (
                "The calculated NPV is positive at the selected discount rate. This indicates that the modeled cash flows exceed the discounted initial investment under the assumptions used."
            )
        elif npv < 0:
            interpretation = (
                "The calculated NPV is negative at the selected discount rate. Under the assumptions used, the modeled discounted cash flows do not fully offset the initial investment."
            )
        else:
            interpretation = (
                "The calculated NPV is approximately zero at the selected discount rate. Under the assumptions used, the modeled discounted cash flows approximately offset the initial investment."
            )

        pdf.multi_cell(0, 6, interpretation, align="L")
        pdf.ln(4)
        pdf.multi_cell(
            0,
            6,
            "The calculated indicators should be considered together with the technical condition, expected lifetime, production assumptions, electricity-price assumptions, operating costs and discount rate. Changes in these assumptions can materially change the results.",
            align="L"
        )

        # ======================================================
        # 19. DISCLAIMER
        # ======================================================

        pdf.add_page()
        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "19. DISCLAIMER", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        disclaimer = (
            "This report is an automated analytical document generated by PV-Valuator. "
            "The calculations are based on the data and assumptions entered into the application and on the calculation methods implemented in the software.\n\n"
            "The Depreciated Asset Value is an indicative analytical value and is not a country-specific tax or accounting valuation. "
            "The PV Economic Value and Residual Value are model-based estimates and should not be interpreted as certified market values.\n\n"
            "Production, electricity prices, operating costs, degradation, equipment condition, financing conditions and other future parameters may differ from the assumptions used in the report. "
            "PVGIS information, where used, is a reference for solar-resource and production analysis and does not constitute a guarantee of future production.\n\n"
            "This report is intended for information and decision-support purposes. It does not constitute legal, tax, accounting, regulatory or investment advice, and it is not intended to replace a country-specific professional assessment where such an assessment is required.\n\n"
            "No representation is made that the results are suitable for a particular transaction, financing decision, accounting treatment, tax filing, court proceeding or regulatory submission. "
            "The user remains responsible for reviewing the assumptions and for the final use and interpretation of the results."
        )

        pdf.multi_cell(0, 5.5, disclaimer, align="L")

        pdf.ln(12)
        pdf.set_draw_color(180, 180, 180)
        y = pdf.get_y()
        pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
        pdf.ln(12)

        # ======================================================
        # SIGNATURE / REPORT IDENTIFICATION
        # ======================================================

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "Report Identification", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"Document ID: {document_id}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"Date: {datum}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if analyst_name:
            pdf.ln(8)
            pdf.cell(0, 6, "Prepared by:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("DejaVu", "B", 10)
            pdf.cell(0, 6, analyst_name, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("DejaVu", "", 10)
            pdf.cell(0, 6, "PV Valuation Analyst", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        signature = sach.get("signature")
        signature_path = None

        if signature:
            try:
                if "," in signature:
                    signature = signature.split(",", 1)[1]
                sig_data = base64.b64decode(signature)
                signature_path = os.path.join(
                    TEMP_DIR,
                    f"signature_{uuid.uuid4().hex}.png"
                )
                with open(signature_path, "wb") as f:
                    f.write(sig_data)

                pdf.ln(5)
                pdf.image(signature_path, x=pdf.l_margin, w=45)
                pdf.ln(2)
            except Exception as e:
                print("Signature error:", e)

        # ======================================================
        # OUTPUT
        # ======================================================

        pdf_output = pdf.output()
        if isinstance(pdf_output, str):
            pdf_output = pdf_output.encode("latin-1", errors="replace")

        pdf_buffer = io.BytesIO(pdf_output)
        pdf_buffer.seek(0)

        pdf_filename = f"pv_valuation_report_{uuid.uuid4().hex}.pdf"
        pdf_path = os.path.join(TEMP_DIR, pdf_filename)

        with open(pdf_path, "wb") as f:
            f.write(pdf_buffer.getvalue())

        # ======================================================
        # SAVE CREDIT TRANSACTION + REPORT HISTORY
        # ======================================================

        try:
            consume_credit(user, "PDF_WERTGUTACHTEN")

            create_report_record(
                user=user,
                data=data,
                filename="PV-VALUATION-REPORT.pdf",
                pdf_path=pdf_path
            )

        except Exception:
            db.session.rollback()
            raise

        # ======================================================
        # CLEAN TEMP FILES
        # ======================================================

        if chart_path and os.path.exists(chart_path):
            os.remove(chart_path)

        if pie_chart_path and os.path.exists(pie_chart_path):
            os.remove(pie_chart_path)

        if logo_path and os.path.exists(logo_path):
            os.remove(logo_path)

        if signature_path and os.path.exists(signature_path):
            os.remove(signature_path)

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name="PV-VALUATION-REPORT.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:

        print(traceback.format_exc())

        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# REPORT HISTORY
# ======================================================

@app.route("/reports/<email>", methods=["GET"])
def get_reports(email):

    try:

        user = User.query.filter_by(
            email=email
        ).first()

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404


        reports = Report.query.filter_by(
            user_id=user.id
        ).order_by(
            Report.created_at.desc()
        ).all()


        result = []

        for report in reports:

            result.append({
                "id": str(report.id),
                "report_type": report.report_type,
                "filename": report.filename,
                "anlagenname": report.anlagenname,
                "kwp": float(report.kwp) if report.kwp else 0,
                "created_at": report.created_at.isoformat()
            })


        return jsonify(result), 200


    except Exception as e:

        print(traceback.format_exc())

        return jsonify({
            "error": str(e)
        }), 500


# ======================================================
# OPEN SAVED PDF REPORT
# ======================================================

@app.route(
    "/reports/pdf/<report_id>",
    methods=["GET"]
)
def open_report_pdf(report_id):

    try:

        report = Report.query.filter_by(
            id=report_id
        ).first()


        if not report:

            return jsonify({
                "error": "Report not found"
            }),404

        if not report.pdf_path:

            return jsonify({
                "error": "PDF path not stored"
            }),404


        if not os.path.exists(report.pdf_path):

            return jsonify({
                "error": "PDF file missing"
            }),404     


        return send_file(
            report.pdf_path,
            mimetype="application/pdf",
            as_attachment=False
        )


    except Exception as e:

        print(traceback.format_exc())

        return jsonify({
            "error": str(e)
        }),500

       

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)



