import React, { useEffect, useState } from "react";
import UserMenu from "../components/UserMenu.jsx";
import { useAuth } from "../context/AuthContext";

function Home() {

    const { user, loading } = useAuth();

    const [packageKey, setPackageKey] =
        useState(null);

    const [checkoutLoading, setCheckoutLoading] =
        useState(false);

    const [checkoutError, setCheckoutError] =
        useState("");


    // ==========================================
    // PACKAGE AUS URL LESEN
    // ==========================================

    useEffect(() => {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const packageParam =
            params.get("package");

        if (packageParam) {

            const normalizedPackage =
                packageParam.toLowerCase();

            // Nur erlaubte Pakete akzeptieren
            const allowedPackages = [
                "starter",
                "professional",
                "premium",
                "business"
            ];

            if (
                allowedPackages.includes(
                    normalizedPackage
                )
            ) {

                setPackageKey(
                    normalizedPackage
                );

            }
            else {

                setCheckoutError(
                    "Ungültiges Paket."
                );

            }

        }

    }, []);


    // ==========================================
    // STRIPE CHECKOUT
    // ==========================================

    useEffect(() => {

        if (
            loading ||
            !user ||
            !packageKey ||
            checkoutLoading
        ) {

            return;

        }


        const createCheckout =
            async () => {

                try {

                    setCheckoutLoading(true);

                    setCheckoutError("");


                    const BACKEND_URL =
                        import.meta.env
                            .VITE_BACKEND_URL;


                    const response =
                        await fetch(
                            `${BACKEND_URL}/stripe/create-checkout-session`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    package:
                                        packageKey,

                                    user_id:
                                        user.id,

                                    user_email:
                                        user.email

                                })
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "Stripe Checkout konnte nicht erstellt werden."
                        );

                    }


                    if (!data.checkout_url) {

                        throw new Error(
                            "Keine Checkout-URL von Stripe erhalten."
                        );

                    }


                    // ==================================
                    // WEITER ZU STRIPE
                    // ==================================

                    window.location.href =
                        data.checkout_url;


                }
                catch (error) {

                    console.error(
                        "CHECKOUT ERROR:",
                        error
                    );


                    setCheckoutError(
                        error.message
                    );


                    setCheckoutLoading(false);

                }

            };


        createCheckout();

    }, [
        loading,
        user,
        packageKey,
        checkoutLoading
    ]);


    // ==========================================
    // LOADING
    // ==========================================

    if (
        loading ||
        checkoutLoading
    ) {

        return (

            <div className="container mt-5 text-center">

                <div className="spinner-border text-primary">
                </div>

                <h3 className="mt-4">
                    Zahlung wird vorbereitet...
                </h3>

                <p className="text-muted">
                    Sie werden sicher zu Stripe weitergeleitet.
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
                    Zahlung konnte nicht vorbereitet werden
                </h2>

                <p className="mt-3">
                    {checkoutError}
                </p>

                <a
                    href="/"
                    className="btn btn-primary mt-3"
                >
                    Zur Startseite
                </a>

            </div>

        );

    }


    // ==========================================
    // NORMALE HOME-SEITE
    // ==========================================

    return (

        <div className="container mt-5">


            <div className="d-flex justify-content-between align-items-center">

                <a
                    href="https://www.pv-valuator.de/"
                    className="btn btn-primary text-white"
                >

                    <i className="bi bi-arrow-left me-2 text-white"></i>

                    <span className="text-white">
                        Startseite
                    </span>

                </a>


                <UserMenu />

            </div>


            <h1 className="text-center mt-5 text-primary fw-bold">

                PV Valuator

                <span className="badge bg-info ms-2">
                    PRO
                </span>

            </h1>


            <p className="text-center text-muted fst-italic fs-5">

                Professionelle Wirtschaftlichkeitsanalyse
                für Photovoltaikanlagen

            </p>


            <p className="text-center text-muted">

                Willkommen zurück.

            </p>


            <div className="text-center mt-4">

                <a
                    href="/analyse"
                    className="btn btn-primary"
                >

                    Neue Analyse starten

                </a>

            </div>


        </div>

    );

}

export default Home;

