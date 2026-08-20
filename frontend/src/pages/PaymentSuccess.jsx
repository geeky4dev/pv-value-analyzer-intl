import React, { useEffect, useState } from "react";


function PaymentSuccess() {

    const [payment, setPayment] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);


    // =====================================================
    // VERIFY STRIPE PAYMENT + GA4 PURCHASE
    // =====================================================

    useEffect(() => {

        const verifyPayment = async () => {

            try {

                // -----------------------------------------
                // GET STRIPE SESSION ID
                // -----------------------------------------

                const params = new URLSearchParams(
                    window.location.search
                );

                const sessionId =
                    params.get("session_id");


                if (!sessionId) {

                    setError(
                        "Keine Stripe-Session-ID gefunden."
                    );

                    setLoading(false);

                    return;
                }


                // -----------------------------------------
                // BACKEND URL
                // -----------------------------------------

                const backendUrl =
                    import.meta.env.VITE_BACKEND_URL;


                // -----------------------------------------
                // VERIFY PAYMENT WITH BACKEND
                // -----------------------------------------

                const response = await fetch(

                    `${backendUrl}/stripe/checkout-session/${sessionId}`

                );


                if (!response.ok) {

                    throw new Error(
                        "Zahlung konnte nicht überprüft werden."
                    );
                }


                const data =
                    await response.json();


                if (!data.paid) {

                    setError(
                        "Die Zahlung wurde noch nicht bestätigt."
                    );

                    setLoading(false);

                    return;
                }


                // -----------------------------------------
                // STORE PAYMENT DATA
                // -----------------------------------------

                setPayment(data);


                // -----------------------------------------
                // GA4 PURCHASE
                // -----------------------------------------

                const purchaseKey =
                    `ga4_purchase_${data.transaction_id}`;


                const alreadyTracked =
                    sessionStorage.getItem(
                        purchaseKey
                    );


                if (
                    !alreadyTracked &&
                    typeof window.gtag === "function"
                ) {

                    window.gtag(
                        "event",
                        "purchase",
                        {

                            transaction_id:
                                data.transaction_id,

                            value:
                                data.value,

                            currency:
                                data.currency,

                            items: [

                                {

                                    item_name:
                                        `PV-Valuator PRO ${data.package}`,

                                    item_category:
                                        "Credits",

                                    quantity:
                                        1,

                                    price:
                                        data.value

                                }

                            ]

                        }
                    );


                    sessionStorage.setItem(
                        purchaseKey,
                        "true"
                    );

                }

            } catch (err) {

                console.error(
                    "PAYMENT VERIFICATION ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Zahlung konnte nicht überprüft werden."
                );

            } finally {

                setLoading(false);

            }

        };


        verifyPayment();

    }, []);


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="container mt-5 text-center">

                <div className="spinner-border text-primary mb-4">
                </div>

                <h4>
                    Zahlung wird überprüft...
                </h4>

                <p className="text-muted">
                    Bitte warten Sie einen Moment.
                </p>

            </div>

        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="container mt-5 text-center">

                <div className="d-flex justify-content-center mt-4 mb-4">

                    <a
                        href="/"
                        className="btn btn-primary text-white"
                    >

                        <i className="bi bi-arrow-left me-2 text-white"></i>

                        <span className="text-white">
                            Startseite
                        </span>

                    </a>

                </div>


                <h2 className="display-6 text-primary fw-bold">

                    PV-Valuator

                    <span className="badge bg-info ms-2">
                        PRO
                    </span>

                </h2>


                <p className="text-muted fst-italic fs-5 mb-5">

                    Professionelle Wirtschaftlichkeitsanalyse
                    für Photovoltaikanlagen

                </p>


                <h3 className="text-danger fw-bold">

                    ❌ Zahlung konnte nicht bestätigt werden

                </h3>


                <p className="mt-4">
                    {error}
                </p>

            </div>

        );

    }


    // =====================================================
    // PAYMENT SUCCESS
    // =====================================================

    return (

        <div className="container mt-5 text-center">


            {/* Startseite Button */}

            <div className="d-flex justify-content-center mt-4 mb-4">

                <a
                    href="/"
                    className="btn btn-primary text-white"
                >

                    <i className="bi bi-arrow-left me-2 text-white"></i>

                    <span className="text-white">
                        Startseite
                    </span>

                </a>

            </div>


            {/* Produktname */}

            <h2 className="display-6 text-primary fw-bold">

                PV-Valuator

                <span className="badge bg-info ms-2">
                    PRO
                </span>

            </h2>


            {/* Produktbeschreibung */}

            <p className="text-muted fst-italic fs-5 mb-5">

                Professionelle Wirtschaftlichkeitsanalyse
                für Photovoltaikanlagen

            </p>


            {/* Erfolgsmeldung */}

            <h3 className="text-success fw-bold">

                ✅ Zahlung erfolgreich

            </h3>


            <p className="mt-4 fs-5">

                Vielen Dank für Ihren Kauf.

            </p>


            <p className="text-muted">

                Ihre Credits wurden Ihrem Konto gutgeschrieben.

            </p>


            {/* Kaufdetails */}

            {payment && (

                <div className="mt-4">

                    <p>
                        <strong>Paket:</strong>{" "}
                        {payment.package}
                    </p>

                    <p>
                        <strong>Credits:</strong>{" "}
                        {payment.credits}
                    </p>

                    <p>
                        <strong>Betrag:</strong>{" "}
                        {Number(payment.value).toFixed(2)}{" "}
                        {payment.currency}
                    </p>

                </div>

            )}

        </div>

    );

}


export default PaymentSuccess;