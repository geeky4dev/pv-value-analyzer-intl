from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import uuid


db = SQLAlchemy()


# ======================================================
# USERS
# ======================================================

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )

    name = db.Column(
        db.String(255),
        nullable=True
    )

    company = db.Column(
        db.String(255),
        nullable=True
    )

    current_plan = db.Column(
        db.String(50),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


    # -------------------------
    # RELACIONES
    # -------------------------

    credit_account = db.relationship(
        "CreditAccount",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )


    credit_transactions = db.relationship(
        "CreditTransaction",
        back_populates="user",
        cascade="all, delete-orphan"
    )


    reports = db.relationship(
        "Report",
        back_populates="user",
        cascade="all, delete-orphan"
    )



# ======================================================
# CREDIT ACCOUNT
# Saldo actual del cliente
# ======================================================

class CreditAccount(db.Model):

    __tablename__ = "credit_accounts"


    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        unique=True,
        nullable=False
    )


    balance = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )


    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship(
        "User",
        back_populates="credit_account"
    )

# ======================================================
# CREDIT TRANSACTIONS
# Historial de movimientos
# ======================================================

class CreditTransaction(db.Model):

    __tablename__ = "credit_transactions"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )


    # PURCHASE
    # REPORT_PDF
    # PVGIS
    type = db.Column(
        db.String(50),
        nullable=False
    )


    # positivo compra
    # negativo consumo

    amount = db.Column(
        db.Integer,
        nullable=False
    )


    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


    user = db.relationship(
        "User",
        back_populates="credit_transactions"
    )



# ======================================================
# REPORTS
# Historial de PDFs generados
# ======================================================

class Report(db.Model):

    __tablename__ = "reports"


    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )


    report_type = db.Column(
        db.String(50),
        nullable=True
    )


    filename = db.Column(
        db.String(255),
        nullable=True
    )

    pdf_path = db.Column(
        db.String,
        nullable=True
    )

    anlagenname = db.Column(
        db.String(255),
        nullable=True
    )


    kwp = db.Column(
        db.Numeric(10,2),
        nullable=True
    )


    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )


    user = db.relationship(
        "User",
        back_populates="reports"
    )