import React, { useEffect, useState } from "react";
import UserMenu from "../components/UserMenu.jsx";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, loading } = useAuth();
  const [packageKey, setPackageKey] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // ==========================================
  // READ PACKAGE FROM URL
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const packageParam = params.get("package");

    if (packageParam) {
      const normalizedPackage = packageParam.toLowerCase();

      // Accept only allowed packages
      const allowedPackages = [
        "starter",
        "professional",
        "expert",
        "business"
      ];

      if (allowedPackages.includes(normalizedPackage)) {
        setPackageKey(normalizedPackage);
      } else {
        setCheckoutError("Invalid package.");
      }
    }
  }, []);

  // ==========================================
  // STRIPE CHECKOUT
  // ==========================================
  useEffect(() => {
    if (loading || !user || !packageKey || checkoutLoading) {
      return;
    }

    const createCheckout = async () => {
      try {
        setCheckoutLoading(true);
        setCheckoutError("");

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

        const response = await fetch(
          `${BACKEND_URL}/stripe/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              package: packageKey,
              user_id: user.id,
              user_email: user.email
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Stripe Checkout could not be created."
          );
        }

        if (!data.checkout_url) {
          throw new Error("No Checkout URL was received from Stripe.");
        }

        // ==================================
        // REDIRECT TO STRIPE
        // ==================================
        window.location.href = data.checkout_url;
      } catch (error) {
        console.error("CHECKOUT ERROR:", error);
        setCheckoutError(error.message);
        setCheckoutLoading(false);
      }
    };

    createCheckout();
  }, [loading, user, packageKey, checkoutLoading]);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading || checkoutLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary"></div>

        <h3 className="mt-4">
          Preparing your payment...
        </h3>

        <p className="text-muted">
          You will be securely redirected to Stripe.
        </p>
      </div>
    );
  }

  // ==========================================
  // CHECKOUT ERROR
  // ==========================================
  if (checkoutError) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="text-danger">
          Payment could not be prepared
        </h2>

        <p className="mt-3">
          {checkoutError}
        </p>

        <a href="/" className="btn btn-primary mt-3">
          Home
        </a>
      </div>
    );
  }

  // ==========================================
  // NORMAL HOME PAGE
  // ==========================================
  return (
    <div className="container mt-2 min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <a
          href="https://www.pv-valuator.com/"
          className="btn btn-primary text-white"
        >
          <i className="bi bi-arrow-left me-2 text-white"></i>
          <span className="text-white">Home</span>
        </a>

        <UserMenu />
      </div>

      <hr
        className="w-100 m-0 border-secondary-subtle"
        style={{
          borderTop: "1px solid",
          opacity: 0.1
        }}
      />

      <h1 className="text-center mt-5 text-primary fw-bold">
        PV-Valuator
        <span className="badge bg-info ms-2">PRO</span>
      </h1>

      <p className="mb-4 text-white-50 fst-italic text-center fs-5">
        Professional Financial Analysis for Photovoltaic Systems
      </p>

      <p className="mb-4 text-white-50 fst-italic text-center fs-5">
        Welcome back.
      </p>

      <div className="text-center mt-4">
        <a href="/analyse" className="btn btn-primary">
          Start New Analysis
        </a>
      </div>
    </div>
  );
}

export default Home;