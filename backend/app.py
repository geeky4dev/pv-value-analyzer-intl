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


STRIPE_PRODUCTS = {
    "starter": {
        "price_id": "price_1TzhfTLNUnDmvz8q5aaqC8rL",
        "credits": 10
    },
    "professional": {
        "price_id": "price_1TzhQXLNUnDmvz8qWTlHOdCY",
        "credits": 25
    },
    "expert": {
        "price_id": "price_1TzhTSLNUnDmvz8qn8y9bhbs",
        "credits": 50
    },
    "business": {
        "price_id": "price_1TzhZzLNUnDmvz8qNppAjxOR",
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
        "balance": account.balance
    })


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
            balance=1
        )


        db.session.add(account)



        transaction = CreditTransaction(

            user_id=user.id,

            type="WELCOME_CREDIT",

            amount=1

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



    if account.balance <= 0:

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


        if account.balance <= 0:

            raise Exception(
                "Keine verfügbaren Credits"
            )



        account.balance -= 1



        transaction = CreditTransaction(

            user_id=user.id,

            type=credit_type,

            amount=-1

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



        account.balance += credits



        transaction = CreditTransaction(

            user_id=user_id,

            type=credit_type,

            amount=credits

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


        if package_key not in STRIPE_PRODUCTS:

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

        product = STRIPE_PRODUCTS[
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
                    STRIPE_SUCCESS_URL
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
                user.credit_account.balance
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
            return jsonify({
                "error": "User email required"
            }), 400


        if not supabase_user_id:
            return jsonify({
                "error": "Supabase user id required"
            }), 400



        user = create_user_if_not_exists(
            supabase_user_id=supabase_user_id,
            email=email,
            name=data.get("user_name"),
            company=data.get("company")
        )

        print("========== CREDIT DEBUG ==========")

        print("USER ID:", user.id)
        print("USER EMAIL:", user.email)

        account = CreditAccount.query.filter_by(
            user_id=user.id
        ).first()

        print("CREDIT ACCOUNT:", account)

        if account:
            print("BALANCE:", account.balance)

        print("==================================")

        try:
            check_credit_available(user)

        except Exception as e:
            return jsonify({
                "error": str(e),
                "code": "NO_CREDITS"
            }), 402

        # ======================================================
        # LCOE CALCULATION
        # ======================================================

        ertrag = data.get("ertragswertData", {})
        buch = data.get("buchwertData", {})
        
        try:
            pr_input = float(ertrag.get("performance_ratio", 100))
        except:
            pr_input = 100.0

        pr = pr_input / 100

        try:
            capex = float(buch.get("anschaffung", 0))
        except:
            capex = 0

        try:
            opex_anual = float(ertrag.get("opex", 0))
        except:
            opex_anual = 0

        try:
            restlaufzeit = float(ertrag.get("restlaufzeit", 0))
        except:
            restlaufzeit = 0

        try:
            jahresproduktion = float(
                ertrag.get("jahresertrag")
                or data.get("pvgisData", {}).get("annual_production")
                or 0
            )
        except:
            jahresproduktion = 0

        total_costs = capex + (opex_anual * restlaufzeit)

        total_energy = jahresproduktion * restlaufzeit

        lcoe = 0

        if total_energy > 0:
            lcoe = total_costs / total_energy


        document_id = data.get("document_id") or "PV-2026-001"

        def fmt_eu(v, unit=""):
            try:
                val = float(v)
                formatted = f"{val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                return f"{formatted}{unit}"
            except:
                return f"0,00{unit}"

        def eur(v):
            return fmt_eu(v, " €")

        class MyPDF(FPDF):
            def header(self):
                if getattr(self, "is_deckblatt", False):
                    return
                self.set_y(10)
                self.set_font("DejaVu", "B", 15)
                self.cell(0, 8, "PV-WIRTSCHAFTLICHKEITSANALYSE", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")

            def footer(self):
                if getattr(self, "is_deckblatt", False):
                    return
                self.set_draw_color(200, 200, 200)
                self.line(self.l_margin, 20, self.w - self.r_margin, 20)

                if self.page_no() > 1:
                    sach = getattr(self, "sachverstaendiger", {})
                    raw_name = sach.get("firma") or sach.get("name") or ""
                    if "/" in raw_name:
                        firma = raw_name.split("/")[-1].strip()
                    else:
                        firma = raw_name.strip()

                    adresse = sach.get("adresse", "")
                    plz_ort = sach.get("plz_ort", "")
                    phone = sach.get("phone", "")
                    email = sach.get("email", "")
                    website = sach.get("website", "")

                    self.set_y(-20)
                    self.set_font("DejaVu", "", 8)
                    self.set_text_color(120, 120, 120)

                    linea1 = " · ".join([x for x in [firma, adresse, plz_ort, website, email] if x])
                    self.multi_cell(0, 4, linea1, align="C")

                self.set_y(-18)
                self.set_font("DejaVu", "", 8)
                self.cell(0, 10, f"Seite {self.page_no()} von {{nb}}", align="C")

        pdf = MyPDF()
        pdf.sachverstaendiger = data.get("sachverstaendiger", {})
        pdf.is_deckblatt = True

        pdf.add_font("DejaVu", "", FONT_PATH, uni=True)
        pdf.add_font("DejaVu", "B", FONT_PATH_BOLD, uni=True)

        pdf.set_auto_page_break(auto=True, margin=20)
        pdf.set_left_margin(20)
        pdf.set_right_margin(20)

        pdf.add_page()
        pdf.set_font("DejaVu", "", 11)

        pdf.set_font("DejaVu", "B", 20)
        pdf.cell(0, 10, "PV-Wirtschaftlichkeitsanalyse", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(4)

        pdf.set_font("DejaVu", "", 14)
        pdf.cell(0, 8, "Technischer Bewertungsbericht für Photovoltaikanlagen", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(10)

        sach = data.get("sachverstaendiger", {})
        ag = data.get("auftraggeber", {})
        anlage = data.get("anlagendaten", {})

        logo = sach.get("logo")
        logo_height = 0

        if logo:
            try:
                if "," in logo:
                    logo = logo.split(",")[1]
                img_data = base64.b64decode(logo)
                logo_path = os.path.join(TEMP_DIR, f"logo_{uuid.uuid4().hex}.png")
                with open(logo_path, "wb") as f:
                    f.write(img_data)
                pdf.image(logo_path, x=pdf.l_margin, y=40, w=25)
                logo_height = 35 * 0.8
            except Exception as e:
                print("Error al cargar el logo:", e)
        else:
            logo_path = None

        pdf.set_y(20 + logo_height + 10)
        pdf.ln(10)

        pdf.set_font("DejaVu", "B", 11)
        name_only = sach.get("name", "").split("/")[0].strip()
        pdf.cell(0, 6, name_only, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, sach.get("adresse", ""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"Telefon: {sach.get('phone','')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"E-Mail: {sach.get('email','')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        website = sach.get("website", "").strip()
        pdf.cell(0, 6, f"Web: {website}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(14)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, ag.get("name",""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, ag.get("adresse",""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, ag.get("plz_ort",""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(12)

        ort_dd = sach.get("ort") or sach.get("plz_ort") or ""
        if not ort_dd:
            adresse_sach = sach.get("adresse", "")
            if "," in adresse_sach:
                try:
                    derecha = adresse_sach.split(",")[1].strip()
                    partes = derecha.split(" ")
                    ort_dd = partes[-1]
                except:
                    ort_dd = ""

        datum_dd = datetime.date.today().strftime("%d.%m.%Y")
        pdf.set_x(pdf.w - pdf.r_margin - 60)
        pdf.cell(60, 6, f"{ort_dd}, {datum_dd}", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(12)

        pdf.set_draw_color(180, 180, 180)
        y_line = pdf.get_y()
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(4)

        betreff1 = "Wirtschaftlichkeitsanalyse der Photovoltaikanlage"
        betreff2 = f"am Standort {anlage.get('adresse','')}, {anlage.get('plz','')} {anlage.get('ort','')}"

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, betreff1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, betreff2, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(12)

        kunde = ag.get("name","").lower()
        if kunde.startswith("frau"):
            anrede = f"Sehr geehrte {ag.get('name','')},"
        elif kunde.startswith("herr"):
            anrede = f"Sehr geehrter {ag.get('name','')},"
        else:
            anrede = "Sehr geehrte Damen und Herren,"

        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, anrede, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(6)

        einleitung = (
            "anbei erhalten Sie den technischen Bewertungsbericht zur oben genannten "
            "Photovoltaikanlage. Der Bericht wurde gemäß den formalen Vorgaben der "
            "DIN 5008 erstellt und enthält sämtliche technischen, wirtschaftlichen sowie "
            "bewertungsspezifischen Informationen."
        )
        pdf.multi_cell(0, 6, einleitung, align="L")

        pdf.ln(8)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, "Mit freundlichen Grüßen", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        signature = sach.get("signature")
        signature_path = None
        sig_y = pdf.get_y()

        if signature:
            try:
                if "," in signature:
                    signature = signature.split(",")[1]
                sig_data = base64.b64decode(signature)
                signature_path = os.path.join(TEMP_DIR, f"deckblatt_signature_{uuid.uuid4().hex}.png")
                with open(signature_path, "wb") as f:
                    f.write(sig_data)
                pdf.image(signature_path, x=pdf.l_margin, y=sig_y, h=25)
            except Exception as e:
                print("Deckblatt signature error:", e)

        pdf.set_xy(pdf.l_margin, sig_y + 25)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, clean_sach_name(sach.get("name") or sach.get("firma") or ""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if signature_path and os.path.exists(signature_path):
            os.remove(signature_path)

        pdf.is_deckblatt = False
        pdf.add_page()

        # ---------------- ZUSAMMENFASSUNG DER BEWERTUNG ----------------
        ertrag = data.get("ertragswertData", {})
        rest = data.get("restwertData", {})
        anlage = data.get("anlagendaten", {})

        try:
            npv = float(ertrag.get("npv", 0))
        except:
            npv = 0

        try:
            irr = float(ertrag.get("irr", 0))
        except:
            irr = 0

        payback = ertrag.get("payback", "-")
        restwert = rest.get("restwert", 0)

        if npv > 5000 and irr >= 8:
            rating = "A – Sehr wirtschaftlich"
            rating_color = (46, 125, 50)
        elif npv > 0 and irr >= 5:
            rating = "B – Wirtschaftlich"
            rating_color = (85, 139, 47)
        elif npv > -5000:
            rating = "C – Eingeschränkte Wirtschaftlichkeit"
            rating_color = (249, 168, 37)
        else:
            rating = "D – Kritische Wirtschaftlichkeit"
            rating_color = (198, 40, 40)

        col_width_1 = 80
        col_width_2 = 80
        ancho_total_tabla = col_width_1 + col_width_2
        start_x = (pdf.w - ancho_total_tabla) / 2

        pdf.ln(10)
        pdf.set_font("DejaVu", "B", 18)
        pdf.cell(0, 10, "Zusammenfassung der Bewertung", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(10)

        pdf.set_x(start_x)
        pdf.set_fill_color(*rating_color)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("DejaVu", "B", 14)
        pdf.cell(ancho_total_tabla, 12, f"Gesamtbewertung: {rating}", border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C", fill=True)

        pdf.set_text_color(0, 0, 0)
        pdf.ln(10)

        summary_rows = [
            ("Wirtschaftlichkeit", "Eingeschränkt" if npv < 0 else "Wirtschaftlich"),
            ("Technischer Zustand", "Gut"),
            ("Investitionsrisiko", "Mittel"),
            ("Renditepotenzial", "Niedrig-Mittel" if irr < 5 else "Gut"),
            ("Amortisationsdauer", f"{payback} Jahre"),
            ("Kapitalwert (NPV)", f"{npv:,.2f} €"),
            ("Interne Rendite (IRR)", f"{irr:.2f} %"),
            ("Restwert", f"{restwert:,.2f} €"),
        ]

        pdf.set_x(start_x)
        pdf.set_font("DejaVu", "B", 11)
        pdf.set_fill_color(220, 230, 241)
        pdf.cell(col_width_1, 8, "Kennzahl", border=1, fill=True, align="C")
        pdf.cell(col_width_2, 8, "Bewertung", border=1, fill=True, align="C", new_x=XPos.LEFT, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)
        for left, right in summary_rows:
            pdf.set_x(start_x)
            val_text = str(right).replace(",", "X").replace(".", ",").replace("X", ".")
            pdf.cell(col_width_1, 8, str(left), border=1, align="L")
            pdf.cell(col_width_2, 8, val_text, border=1, new_x=XPos.LEFT, new_y=YPos.NEXT, align="C")

        pdf.ln(12)

        pdf.set_font("DejaVu", "B", 12)
        pdf.cell(0, 8, "Empfehlung", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        pdf.set_font("DejaVu", "", 10)
        if npv < 0:
            empfehlung = (
                "Die Anlage weist aktuell eine eingeschränkte Wirtschaftlichkeit auf. "
                "Eine Verbesserung der Rentabilität kann insbesondere durch einen "
                "höheren Eigenverbrauch erzielt werden."
            )
        else:
            empfehlung = (
                "Die Photovoltaikanlage zeigt eine wirtschaftlich positive Entwicklung "
                "mit stabilem Ertragspotenzial."
            )

        pdf.multi_cell(0, 6, empfehlung, align="L")

        pdf.ln(10)
        y_line = pdf.get_y()
        pdf.set_draw_color(180, 180, 180)
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(10)

        buch = data.get("buchwertData", {})
        ertrag = data.get("ertragswertData", {})
        rest = data.get("restwertData", {})
        marktfaktor = float(rest.get("marktfaktor", 100))
        
        production = (
            ertrag.get("production")
            or ertrag.get("jahresertrag")
            or data.get("pvgisData", {}).get("production")
            or data.get("pvgisData", {}).get("annual_production")
            or data.get("production")
        )

        pdf.add_page()
        pdf.ln(10)

        pdf.set_font("DejaVu", "B", 14)
        pdf.cell(0, 8, "Technischer Bewertungsbericht", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
        pdf.ln(5)

        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(0, 6, "Dieses Dokument stellt eine automatisierte technische und wirtschaftliche Analyse einer Photovoltaikanlage dar.", align="L")
        pdf.ln(5)

        pdf.cell(0, 6, f"Erstellungsdatum: {datetime.date.today().strftime('%d.%m.%Y')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
        pdf.cell(0, 6, f"Dokument-ID: {document_id}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")

        pdf.ln(8)
        y_line = pdf.get_y()
        pdf.set_draw_color(180, 180, 180)
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(8)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "1. AUFTRAGGEBER:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)

        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, ag.get('name', ''), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, ag.get("adresse", ""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, ag.get("plz_ort", ""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"Telefon: {ag.get('telefon', '')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"E-Mail: {ag.get('email', '')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(8)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "2. BEARBEITET / GEPRÜFT DURCH:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(3)

        pdf.set_font("DejaVu", "", 10)
        fields = [sach.get("name", ""), sach.get("firma", ""), sach.get("adresse", ""), sach.get("plz_ort", "")]
        for f in fields:
            clean = str(f).strip().replace("\n", " ").replace("\r", " ")
            if clean:
                pdf.cell(0, 6, clean, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        #pdf.ln(3)
        pdf.cell(0, 6, f"Telefon: {sach.get('phone', '')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"E-Mail: {sach.get('email', '')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"Web: {sach.get('website', '')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(8)
        y_line = pdf.get_y()
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(8)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "3. ANLAGENOBJEKT:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        installationsart = anlage.get("installationsart", "")
        objekt_text = f"Photovoltaikanlage auf {installationsart}" if installationsart else "Photovoltaikanlage auf Dachfläche (Gewerbe / Wohngebäude)"
        pdf.cell(0, 6, objekt_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(8)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "4. STANDORT:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        adresse = anlage.get("adresse", "")
        plz = anlage.get("plz", "")
        ort = anlage.get("ort", "")
        bundesland = anlage.get("bundesland", "")

        standort_text = f"{adresse}, {plz} {ort}"
        if bundesland:
            standort_text += f", {bundesland}, Deutschland"
        else:
            standort_text += ", Deutschland"

        pdf.multi_cell(0, 6, standort_text, align="L")
        pdf.ln(8)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "5. BEWERTUNGSZIEL:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(0, 6, "Ziel der Analyse ist die Bewertung der Wirtschaftlichkeit der\nPhotovoltaikanlage zum Bewertungsstichtag.", align="L")

        pdf.ln(8)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "6. VERWENDUNGSZWECK:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(0, 6, "Dieser Bericht dient als Entscheidungsgrundlage für Investitions-\nund Projektbewertungen im Bereich Photovoltaik.", align="L")

        #pdf.ln(9)
        #y_line = pdf.get_y()
        #pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        
        pdf.add_page()
        pdf.ln(10)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "7. STANDORTDATEN:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"- Ort: {anlage.get('ort', '-')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Bundesland: {anlage.get('bundesland', '-')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, "- Land: Deutschland", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        try:
            breitengrad = float(anlage.get("breitengrad", 0) or 0)
        except:
            breitengrad = 0
        try:
            langengrad = float(anlage.get("langengrad", 0) or 0)
        except:
            langengrad = 0

        pdf.cell(0, 6, f"- Breitengrad: {breitengrad:.4f}°", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Längengrad: {langengrad:.4f}°", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(9)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "8. ANLAGENDATEN:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"- Anlagenleistung: {fmt_eu(anlage.get('kwp', 0))} kWp", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Installationsart: {anlage.get('installationsart', '-')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Modultechnologie: {anlage.get('modultyp', '-')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Dachneigung / Modulneigung: {fmt_eu(anlage.get('dachneigung', 0))}°", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Ausrichtung (Azimut): {fmt_eu(anlage.get('azimut', 0))}°", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Performance Ratio (PR): {fmt_eu(pr_input)} % (typischer Wert für Dachanlagen in DE)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Spezifischer Ertrag: {fmt_eu(ertrag.get('spezifischer_ertrag', 0))} kWh/kWp.a", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        prod_val = "-"
        if production != "-":
            try:
                prod_val = fmt_eu(float(production))
            except:
                prod_val = "-"
        pdf.cell(0, 6, f"- Jahresproduktion (PVGIS): ca. {prod_val} kWh/a", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Inbetriebnahme: {anlage.get('inbetriebnahme', '-')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Restlaufzeit: {ertrag.get('restlaufzeit', '-')} Jahre", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Degradation: {fmt_eu(ertrag.get('degradation', 0))} % p.a.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(9)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "9. TECHNISCHE DETAILS:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        modul = f"{anlage.get('modulhersteller','-')} {anlage.get('modellmodule','')}".strip()
        wr = f"{anlage.get('wrhersteller','-')} {anlage.get('wrmodell','')}".strip()
        wechselrichtertyp = anlage.get("wechselrichtertyp") or wr

        wartung = anlage.get('letztewartung') or "n.a."
        probleme = anlage.get('probleme') or "Keine"

        wr_installationsjahr = anlage.get('wrinstallationsjahr') or "n.a."
        wr_austausch = anlage.get('wraustausch') or "Nein"

        pdf.cell(0, 6, f"- Module Modell: {modul}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Wechselrichter Modell: {wr}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Wechselrichtertyp: {wechselrichtertyp}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- WR Installationsjahr: {wr_installationsjahr}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Austausch bereits erfolgt: {wr_austausch}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Letzte Wartung: {wartung}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Wartungsvertrag vorhanden: {anlage.get('wartungsvertrag', 'Nein')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Bekannte Probleme: {probleme}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(9)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "10. BETRIEBSMODELL:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        raw_val = str(ertrag.get("betriebsmodell") or "").strip()
        val_clean = raw_val.lower().replace(" ", "").replace("/", "").replace("+", "").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")

        modelos = {
            "volleinspeisung": "Volleinspeisung",
            "eigenverbrauch": "Eigenverbrauch + Teileinspeisung",
            "eigenverbrauch_batterie": "Eigenverbrauch mit Speicher",
            "mieterstrom": "Mieterstrommodell",
            "direktvermarktung": "Direktvermarktung / Marktprämie",
        }

        for key, label in modelos.items():
            is_selected = (val_clean == key)
            simbolo = "☑" if is_selected else "☐"
            pdf.cell(0, 6, f"{simbolo} {label}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        ertrag = data.get("ertragswertData", {})

        eigen_raw = ertrag.get("eigenverbrauch_anteil") or "0"
        try:
            # Limpia % y comas, convierte a float
            eigen_clean = str(eigen_raw).replace("%", "").replace(",", ".").strip()
            eigen = float(eigen_clean)

            # 🔥 NORMALIZACIÓN INTELIGENTE
            # si viene como ratio (0–1), convertir a porcentaje
            if eigen <= 1:
                eigen = eigen * 100

        except:
            eigen = 0.0

        # límites
        eigen = max(0.0, min(eigen, 100.0))

        batterie_verluste = float(ertrag.get("batterie_verluste") or 0)

        netz = 100.0 - eigen - batterie_verluste
        netz = max(0.0, netz)

        # Imprimir formato alemán
        #pdf.set_font("DejaVu", "", 10)
        #pdf.cell(0, 6, f"- Eigenverbrauchsanteil: {eigen:.2f}".replace(".", ",") + " %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        #pdf.cell(0, 6, f"- Netzeinspeisung: {netz:.2f}".replace(".", ",") + " %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.add_page()
        pdf.ln(10)

        # SOLO MOSTRAR PIE CHART PARA ESTOS MODELOS
        show_pie_chart = val_clean in ["eigenverbrauch", "eigenverbrauch_batterie"]

        # ======================================================
        # PIE CHART - EIGENVERBRAUCH vs NETZEINSPEISUNG
        # ======================================================
        pie_chart_path = None  # 👈 IMPORTANTE
        
        if show_pie_chart:
            pie_chart_path = os.path.join(
                TEMP_DIR,
                f"piechart_{uuid.uuid4().hex}.png"
            )

            labels = [
                f"Eigenverbrauch\n{eigen:.1f} %",
                f"Netzeinspeisung\n{netz:.1f} %"
            ]

            sizes = [eigen, netz]

            plt.figure(figsize=(3, 3))

            plt.pie(
                sizes,
                labels=labels,
                autopct='%1.1f%%',
                startangle=90
            )

            plt.title("Eigenverbrauch vs. Netzeinspeisung", fontweight='bold')

            plt.axis('equal')

            plt.savefig(
                pie_chart_path,
                bbox_inches="tight",
                transparent=False
            )

            plt.close('all')
            gc.collect()

            # INSERTAR EN PDF
            if os.path.exists(pie_chart_path):

                #pdf.ln(5)

                #pdf.set_font("DejaVu", "B", 11)
                #pdf.cell(
                #    0,
                #    8,
                #    "Eigenverbrauchsverteilung",
                #    align="C",
                #    new_x=XPos.LMARGIN,
                #    new_y=YPos.NEXT
                #)

                #pdf.ln(3)

                img_width = 90
                page_width = pdf.w - pdf.l_margin - pdf.r_margin
                x_center = pdf.l_margin + (page_width - img_width) / 2

                pdf.image(
                    pie_chart_path,
                    x=x_center,
                    w=img_width
                )
                # ✅ SOLO SI SE DIBUJA EL CHART
                pdf.ln(5)

        def get_eeg_data_local(betriebsmodell, kwp):
            try:
                kwp = float(kwp or 0)
            except:
                kwp = 0
            bm = str(betriebsmodell or "").lower().replace(" ", "")
            einspeiseverguetung = "-"
            eeg_periode = "Feb–Jul 2026"
            if "mieterstrom" in bm:
                if kwp <= 10: einspeiseverguetung = "2,56 ct/kWh"
                elif kwp <= 40: einspeiseverguetung = "2,38 ct/kWh"
                elif kwp <= 100: einspeiseverguetung = "2,38 ct/kWh"
                else: einspeiseverguetung = "1,60 ct/kWh"
            elif "direktvermarktung" in bm:
                if kwp <= 10: einspeiseverguetung = "8,18 ct/kWh"
                elif kwp <= 40: einspeiseverguetung = "7,13 ct/kWh"
                elif kwp <= 100: einspeiseverguetung = "5,90 ct/kWh"
                else: einspeiseverguetung = "5,90–7,70 ct/kWh"
            elif "volleinspeisung" in bm:
                if kwp <= 10: einspeiseverguetung = "12,34 ct/kWh"
                else: einspeiseverguetung = "10,35 ct/kWh"
            elif "eigenverbrauch" in bm:
                if kwp <= 10: einspeiseverguetung = "7,78 ct/kWh"
                elif kwp <= 40: einspeiseverguetung = "6,73 ct/kWh"
                else: einspeiseverguetung = "5,50 ct/kWh"
            return einspeiseverguetung, eeg_periode

        kwp_val = anlage.get("kwp", 0)
        eeg_tarif, eeg_periode = get_eeg_data_local(anlage.get("betriebsmodell") or ertrag.get("betriebsmodell"), kwp_val)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "11. VERGÜTUNG / EEG-RAHMENDATEN:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.cell(0, 6, f"- Einspeisevergütung: {eeg_tarif}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- EEG-Periode (Tarifzeitraum): {eeg_periode}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, "- Vergütungsdauer: 20 Jahre ab Inbetriebnahme (gemäß EEG)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(9)
        y_line = pdf.get_y()
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(9)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "12. BEWERTUNGSMETHODIK:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(0, 6, "Die Analyse basiert auf standardisierten Annahmen und vereinfachten Modellen.\nIndividuelle projektspezifische Faktoren werden nur eingeschränkt berücksichtigt.\nDie Ergebnisse stellen eine indikative Bewertung dar und ersetzen keine\nindividuelle fachliche Prüfung durch einen qualifizierten Sachverständigen.")

        pdf.ln(9)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "13. EINSCHRÄNKUNGEN DER BEWERTUNG:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(0, 6, "Die Bewertung der Photovoltaikanlage erfolgt auf Basis des Ertragswertverfahrens unter Berücksichtigung folgender Faktoren:\n - Technische Anlagenparameter (Leistung, PR, Degradation)\n - Standortbezogene Ertragsdaten (PVGIS)\n - Wirtschaftliche Kennzahlen (NPV, IRR)\n - Laufzeit der Anlage und Restnutzungsdauer ")

        pdf.ln(9)

        pdf.set_font("DejaVu", "B", 11)
        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 6, "14. ANNAHMEN:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 6, "Für die Berechnung wurden folgende Annahmen getroffen:\n- Keine signifikante Verschattung der Anlage\n- Konstante regulatorische Rahmenbedingungen", align="L")

        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 6, f"- Durchschnittliche Degradation von {fmt_eu(ertrag.get('degradation', 0))} % pro Jahr", align="L")

        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 6, "- Betriebskosten bleiben konstant\n- Keine außerplanmäßigen Reparaturen", align="L")

        pdf.ln(9)
        y_line = pdf.get_y()
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)

        pdf.add_page()
        pdf.ln(10)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "15. BEWERTUNGSDATEN:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        try:
            investitionskosten = float(buch.get("anschaffung"))
        except:
            investitionskosten = 12000.0

        buchwert = buch.get("buchwert") or 9600.0
        opex = ertrag.get("opex") or 200.0
        diskontsatz = ertrag.get("diskontsatz") or 5.0
        strompreis_raw = ertrag.get("strompreis", 0)
        try:
            strompreis = float(str(strompreis_raw).replace(",", "."))
        except:
            strompreis = 0.0

        ev_anteil = ertrag.get("eigenverbrauch_anteil") or 0

        pdf.cell(0, 6, f"- Investitionskosten (CAPEX): {eur(investitionskosten)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Laufende Betriebskosten (OPEX): {fmt_eu(opex)} € / Jahr", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Strompreis: {fmt_eu(strompreis)} € / kWh", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Diskontierungszins (WACC): {fmt_eu(diskontsatz)} %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Buchwert (nach AfA gem. EStG): {eur(buchwert)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(10)

        cashflows = ertrag.get("cashflows", [])

        # ======================================================
        # PRIORITY 5 - CASHFLOW CHART
        # ======================================================

        chart_path = None

        if cashflows and len(cashflows) > 1:

            years = list(range(1, len(cashflows)))

            values = cashflows[1:]  # ignorar año 0 si existe

            plt.figure(figsize=(8, 4))

            plt.plot(years, values, marker='o')

            plt.xlabel("Jahr")
            plt.ylabel("Cashflow (€)")
            plt.title("Cashflow Entwicklung")

            plt.grid(True)

            # Línea de break-even (opcional pero PRO)
            plt.axhline(0, linestyle='--')

            chart_path = os.path.join(
                TEMP_DIR,
                f"cashflow_{uuid.uuid4().hex}.png"
            )

            plt.savefig(chart_path, bbox_inches="tight")

            plt.close('all')
            gc.collect()


        if len(cashflows) > 1:
            
            pdf.set_font("DejaVu", "B", 11)
            pdf.cell(0, 10, "16. CASHFLOW-ANALYSE (Auszug 20 Jahre)", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
            pdf.ln(4)

            col_width_jahr = 40
            col_width_val = 125
            ancho_total_tabla = col_width_jahr + col_width_val
            posicion_x_centrada = (pdf.w - ancho_total_tabla) / 2

            pdf.set_fill_color(*rating_color)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font("DejaVu", "B", 12)
            pdf.cell(0, 10, "Detaillierte Liquiditätsentwicklung", border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C", fill=True)
            pdf.set_text_color(0, 0, 0)
            pdf.ln(4)

            col_width_jahr = 40
            col_width_val = 129

            pdf.set_font("DejaVu", "B", 11)
            pdf.set_fill_color(220, 230, 241)
            pdf.cell(col_width_jahr, 8, "Jahr", border=1, fill=True, align="C")
            pdf.cell(col_width_val, 8, "Cashflow (Netto)", border=1, fill=True, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            pdf.set_font("DejaVu", "", 10)

            for i in range(1, min(21, len(cashflows))):
                fill_row = i % 2 == 0
                if fill_row:
                    pdf.set_fill_color(245, 245, 245)

                pdf.cell(col_width_jahr, 7, f"Jahr {i}", border=1, fill=fill_row, align="C")
                valor_formateado = fmt_eu(cashflows[i])
                pdf.cell(col_width_val, 7, valor_formateado, border=1, fill=fill_row, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            # ======================================================
            # CASHFLOW CHART INSERT
            # ======================================================

            if chart_path and os.path.exists(chart_path):

                pdf.ln(10)
                pdf.add_page()
                pdf.ln(10)

                #pdf.set_font("DejaVu", "B", 11)
                #pdf.cell(
                #    0,
                #    8,
                #    "Cashflow Entwicklung (Grafik)",
                #    align="C",
                #    new_x=XPos.LMARGIN,
                #    new_y=YPos.NEXT
                #)

                pdf.ln(4)

                # --- ANCHO DE LA IMAGEN ---
                img_width = 170  # ajusta aquí el tamaño

                # --- CALCULAR CENTRADO ---
                page_width = pdf.w - pdf.l_margin - pdf.r_margin
                x_center = pdf.l_margin + (page_width - img_width) / 2

                pdf.image(
                    chart_path,
                    x=x_center,
                    w=img_width
                )                

        pdf.ln(10)

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "17. ERGEBNISSE DER WIRTSCHAFTLICHKEITSANALYSE:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)

        npv = ertrag.get("npv") or 6810.36
        irr = ertrag.get("irr") or 11.78

        rest = data.get("restwertData", {})
        zustand_label = (
            rest.get("zustand_label")
            or rest.get("zustand")
            or rest.get("condition")
            or "Unbekannt"
        )

        ertrag = data.get("ertragswertData", {})
        raw_val = ertrag.get("ertragswertKumuliert")
        try:
            if raw_val and str(raw_val).strip() != "":
                ertragswert_val = float(raw_val)
            else:
                ertragswert_val = 0.0
        except (ValueError, TypeError):
            ertragswert_val = 0.0

        restwert_val = rest.get("restwert") or 17217.11
        marktfaktor = float(rest.get("marktfaktor", 100))

        if marktfaktor == 90:
            markt_label = "Schwach"
        elif marktfaktor == 110:
            markt_label = "Stark"
        else:
            markt_label = "Normal"

        payback_val = ertrag.get("payback")

        zuk = float(rest.get("zukuenftige_gewinne") or 0)
        kosten = float(rest.get("kostenabschlag") or 0)
        verkauf = float(rest.get("verkaufsabschlag") or 0)
        
        wartung_raw = rest.get("wartung", False)

        if isinstance(wartung_raw, str):
            wartung = wartung_raw.lower() in ["true", "1", "yes", "ja"]
        else:
            wartung = bool(wartung_raw)

        pdf.cell(0, 6, f"- Abschlag für Kosten: {kosten:.1f} %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Abschlag für Verkauf: {verkauf:.1f} %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        try:
            roi = ((ertragswert_val - investitionskosten) / investitionskosten) * 100
        except:
            roi = 0

        pdf.cell(0, 6, f"- Netto-Kapitalwert (NPV): {eur(npv)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Interne Verzinsung (IRR): {fmt_eu(irr)} %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Return on Investment (ROI): {fmt_eu(roi)} %", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Stromgestehungskosten (LCOE): {fmt_eu(lcoe)} € / kWh", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        payback_text = f"{fmt_eu(payback_val).replace(',00', '')} Jahre" if payback_val else "n.a."
        pdf.cell(0, 6, f"- Amortisationsdauer (Payback): {payback_text}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Zustand der Anlage: {zustand_label}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        wartung_text = " (inkl. Wartungseffekt +15%)" if wartung else ""
        pdf.cell(0, 6, f"- Zukünftige Gewinne: {eur(zuk)}{wartung_text}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.cell(0, 6, f"- Ertragswert (kumuliert): {eur(ertragswert_val)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 6, f"- Restwert: {eur(restwert_val)} (Marktfaktor: {markt_label} {marktfaktor:.0f}%)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(10)

        try:
            npv_val = float(npv)
        except:
            npv_val = 0

        if npv_val > 0:
            interpretation = "Der positive Kapitalwert zeigt, dass die Photovoltaikanlage wirtschaftlich rentabel ist."
        elif npv_val == 0:
            interpretation = "Der Kapitalwert ist neutral. Die Investition deckt exakt die Kapitalkosten."
        elif npv_val > -5000:
            interpretation = "Der negative Kapitalwert deutet auf eine eingeschränkte Wirtschaftlichkeit hin."
        else:
            interpretation = "Der deutlich negative Kapitalwert zeigt, dass die Investition wirtschaftlich nicht empfehlenswert ist."

        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "18. INTERPRETATION DER ERGEBNISSE:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("DejaVu", "", 10)
        pdf.multi_cell(0, 6, interpretation)

        pdf.ln(10)
        y_line = pdf.get_y()
        pdf.line(pdf.l_margin, y_line, pdf.w - pdf.r_margin, y_line)
        pdf.ln(10)

        pdf.add_page()
        pdf.ln(10)
        
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "19. HAFTUNGSAUSSCHLUSS:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)

        haftung_text = (
            "Dieser Analysebericht wurde nach bestem Wissen und Gewissen unter Anwendung anerkannter "
            "technischer Bewertungsmethoden erstellt. Die formale Gestaltung orientiert sich "
            "an den Vorgaben der DIN 5008.\n\n"
            "Es handelt sich nicht um ein gerichtlich anerkanntes Sachverständigengutachten "
            "und entfaltet keine rechtliche Bindungswirkung.\n\n"
            "Die im Analysebericht enthaltenen Ergebnisse und Bewertungen basieren auf den zum "
            "Zeitpunkt der Erstellung verfügbaren Daten sowie auf getroffenen Annahmen. "
            "Für deren Vollständigkeit und Richtigkeit wird keine Gewähr übernommen.\n\n"
            "Dieser Analysebericht dient ausschließlich zu Informations- und Entscheidungsunterstützung. "
            "Eine Haftung für Entscheidungen, die auf Grundlage dieses Berichts getroffen werden, wird – "
            "soweit gesetzlich zulässig – ausgeschlossen.\n\n"
            "Die Weitergabe an Dritte oder die Veröffentlichung, auch auszugsweise, bedarf der vorherigen "
            "schriftlichen Zustimmung des Erstellers.\n\n"
            "Eine Verwendung für gerichtliche oder behördliche Zwecke ist nicht vorgesehen. "
            "Die Verantwortung für die finale Bewertung und Nutzung der Ergebnisse liegt beim Anwender."
        )

        pdf.multi_cell(0, 5, haftung_text, align="L")

        pdf.ln(10)
        y = pdf.get_y()
        pdf.set_draw_color(180, 180, 180)
        pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
        pdf.ln(15)

        ort_final = anlage.get("ort", "")
        datum = datetime.date.today().strftime("%d.%m.%Y")

        base_y = pdf.get_y()
        logo_x = pdf.l_margin
        logo_y = base_y + 8

        text_x = 55
        text_y = base_y

        signature_x = text_x
        signature_y = base_y + 20

        pdf.set_xy(text_x, text_y)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "ORT, DATUM:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_x(text_x)
        pdf.set_font("DejaVu", "", 10)
        ort_text = f"{ort_final}, {datum}" if ort_final else datum
        pdf.cell(0, 6, ort_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        logo = sach.get("logo")
        logo_path = None

        if logo:
            try:
                if "," in logo:
                    logo = logo.split(",")[1]
                logo_data = base64.b64decode(logo)
                logo_path = os.path.join(TEMP_DIR, f"logo_{uuid.uuid4().hex}.png")
                with open(logo_path, "wb") as f:
                    f.write(logo_data)
                pdf.image(logo_path, x=logo_x, y=logo_y, w=28)
            except Exception as e:
                print("Logo error:", e)

        pdf.set_xy(text_x, signature_y - 5)
        pdf.set_font("DejaVu", "B", 11)
        pdf.cell(0, 6, "UNTERSCHRIFT:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        signature = sach.get("signature")
        signature_path = None

        if signature:
            try:
                if "," in signature:
                    signature = signature.split(",")[1]
                sig_data = base64.b64decode(signature)
                signature_path = os.path.join(TEMP_DIR, f"signature_{uuid.uuid4().hex}.png")
                with open(signature_path, "wb") as f:
                    f.write(sig_data)
                pdf.image(signature_path, x=signature_x, y=signature_y, w=28)
            except Exception as e:
                print("Signature error:", e)

        line_y = signature_y + 23
        pdf.line(signature_x, line_y, signature_x + 65, line_y)

        pdf.set_xy(signature_x, line_y + 3)
        pdf.set_font("DejaVu", "B", 10)
        pdf.cell(0, 6, sach.get("name", ""), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("DejaVu", "", 10)
        pdf.set_x(signature_x)
        pdf.cell(0, 6, "Sachverständiger für Photovoltaikanlagen", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_x(signature_x)
        pdf.cell(0, 6, "Zertifizierungsstelle: _____________", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_x(signature_x)
        pdf.cell(0, 6, "Zertifikats-Nr.: ___________________", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if logo_path and os.path.exists(logo_path):
            os.remove(logo_path)
        if signature_path and os.path.exists(signature_path):
            os.remove(signature_path)

        pdf_output = pdf.output()
        if isinstance(pdf_output, str):
            pdf_output = pdf_output.encode("latin-1", errors="replace")

        pdf_buffer = io.BytesIO(pdf_output)
        pdf_buffer.seek(0)

        # ======================================================
        # SAVE PDF FILE
        # ======================================================

        pdf_filename = (
            f"report_{uuid.uuid4().hex}.pdf"
        )

        pdf_path = os.path.join(
            TEMP_DIR,
            pdf_filename
        )


        with open(pdf_path, "wb") as f:
            f.write(pdf_buffer.getvalue())

        # ======================================================
        # SAVE CREDIT TRANSACTION + REPORT HISTORY
        # ======================================================

        try:

            consume_credit(
                user,
                "PDF_WERTGUTACHTEN"
            )

            print("==============================")
            print("DEBUG PDF")
            print("TEMP_DIR:", TEMP_DIR)
            print("pdf_path:", pdf_path)
            print("exists:", os.path.exists(pdf_path))
            print("==============================")


            create_report_record(
                user=user,
                data=data,
                filename="PV-WERTGUTACHTEN.pdf",
                pdf_path=pdf_path
            )


        except Exception:

            db.session.rollback()

            raise


        # DELETE TEMP CASHFLOW CHART
        if chart_path and os.path.exists(chart_path):
            os.remove(chart_path)


        # DELETE TEMP PIE CHART
        if pie_chart_path and os.path.exists(pie_chart_path):
            os.remove(pie_chart_path)


        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name="PV-WERTGUTACHTEN.pdf",
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



