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
                        "No Stripe session ID was found."
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
                        "Payment could not be verified."
                    );
                }


                const data =
                    await response.json();


                if (!data.paid) {

                    setError(
                        "The payment has not yet been confirmed."
                    );

                    setLoading(false);

                    return;
                }


                // -----------------------------------------
                // STORE PAYMENT DATA
                // -----------------------------------------

                setPayment(data);


                // -----------------------------------------
                // GA4 PURCHASE + META PURCHASE
                // -----------------------------------------

                const purchaseKey =
                    `ga4_purchase_${data.transaction_id}`;


                const alreadyTracked =
                    sessionStorage.getItem(
                        purchaseKey
                    );


                if (!alreadyTracked) {

                    // -----------------------------------------
                    // GA4 PURCHASE
                    // -----------------------------------------

                    if (typeof window.gtag === "function") {

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

                    }


                    // -----------------------------------------
                    // META PIXEL PURCHASE
                    // -----------------------------------------

                    if (typeof window.fbq === "function") {

                        window.fbq(
                            "track",
                            "Purchase",
                            {
                                value:
                                    data.value,

                                currency:
                                    data.currency
                            }
                        );

                    }


                    // -----------------------------------------
                    // MARK PURCHASE AS TRACKED
                    // -----------------------------------------

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
                    "Payment could not be verified."
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

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#03111D"
                }}
            >

                <main className="flex-grow-1">

                    <div className="container mt-5 text-center">

                        <div className="spinner-border text-primary mb-4">
                        </div>

                        <h4 className="text-white">
                            Verifying payment...
                        </h4>

                        <p
                            style={{
                                color: "rgba(255, 255, 255, 0.2)"
                            }}
                        >
                            Please wait a moment.
                        </p>

                    </div>

                </main>


                {/* FOOTER */}

                <footer
                    className="py-3"
                    style={{
                        width: "100%",
                        backgroundColor: "#03111D"
                    }}
                >

                    <div className="container-fluid">

                        <div
                            className="
                                d-flex
                                justify-content-center
                                align-items-center
                                gap-3
                                flex-wrap
                            "
                        >

                            <img
                                src="/logo-apps4green.png"
                                alt="Apps For Green"
                                style={{
                                    height: "30px"
                                }}
                            />

                            <span className="text-white-50 small">
                                © 2026 Apps For Green
                            </span>

                            <span className="text-white-50">
                                ·
                            </span>

                            <a
                                href="https://www.apps4green.com"
                                className="text-primary text-decoration-none small"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                www.apps4green.com
                            </a>

                        </div>

                    </div>

                </footer>

            </div>

        );
    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#03111D"
                }}
            >

                <main className="flex-grow-1">

                    <div className="container mt-5 text-center">

                        {/* Home Button */}

                        <div className="d-flex justify-content-center mt-4 mb-4">

                            <a
                                href="/"
                                className="btn btn-primary text-white"
                            >

                                <i className="bi bi-arrow-left me-2 text-white"></i>

                                <span className="text-white">
                                    Home
                                </span>

                            </a>

                        </div>


                        {/* Product Name */}

                        <h2 className="text-primary fw-bold">
                        
                            PV-Valuator

                            <span className="badge bg-info ms-2">
                                PRO
                            </span>

                        </h2>


                        {/* Product Description */}

                        <p
                            className="fst-italic mt-2"
                            style={{ color: "rgba(255, 255, 255, 0.2)" }}
                        >
                            Professional Financial Analysis
                            for Photovoltaic Systems
                        </p>


                        {/* Error */}

                        <h3 className="text-danger fw-bold">

                            ❌ Payment could not be confirmed

                        </h3>


                        <p
                            className="mt-4"
                            style={{
                                color: "rgba(255, 255, 255, 0.2)"
                            }}
                        >
                            {error}
                        </p>

                    </div>

                </main>


                {/* FOOTER */}

                <footer
                    className="py-3"
                    style={{
                        width: "100%",
                        backgroundColor: "#03111D"
                    }}
                >

                    <div className="container-fluid">

                        <div
                            className="
                                d-flex
                                justify-content-center
                                align-items-center
                                gap-3
                                flex-wrap
                            "
                        >

                            <img
                                src="/logo-apps4green.png"
                                alt="Apps For Green"
                                style={{
                                    height: "30px"
                                }}
                            />

                            <span className="text-white-50 small">
                                © 2026 Apps For Green
                            </span>

                            <span className="text-white-50">
                                ·
                            </span>

                            <a
                                href="https://www.apps4green.com"
                                className="text-primary text-decoration-none small"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                www.apps4green.com
                            </a>

                        </div>

                    </div>

                </footer>

            </div>

        );
    }


    // =====================================================
    // PAYMENT SUCCESS
    // =====================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#03111D"
            }}
        >

            <main className="flex-grow-1">

                <div className="container mt-5 text-center">

                    {/* Home Button */}

                    <div className="d-flex justify-content-center mt-4 mb-4">

                        <a
                            href="/"
                            className="btn btn-primary text-white"
                        >

                            <i className="bi bi-arrow-left me-2 text-white"></i>

                            <span className="text-white">
                                Home
                            </span>

                        </a>

                    </div>


                    {/* Product Name */}

                    <h2 className="text-primary fw-bold">

                        PV-Valuator

                        <span className="badge bg-info ms-2">
                            PRO
                        </span>

                    </h2>


                    {/* Product Description */}

                    <p
                        className="fst-italic mt-2"
                        style={{
                            color: "rgba(255, 255, 255, 0.2)"
                        }}
                    >
                        Professional Financial Analysis
                        for Photovoltaic Systems
                    </p>


                    {/* Success Message */}

                    <h3 className="text-success fw-bold">

                        ✅ Payment Successful

                    </h3>


                    <p
                        className="mt-3"
                        style={{
                            color: "rgba(255, 255, 255, 0.85)"
                        }}
                    >
                        Thank you for your purchase.
                    </p>


                    <p
                        style={{
                            color: "rgba(255, 255, 255, 0.2)"
                        }}
                    >
                        Your credits have been added to your account.
                    </p>


                    {/* Purchase Details */}

                    {payment && (

                        <div className="mt-4">

                            <p className="text-white-50">
                                <strong>Package:</strong>{" "}
                                {payment.package}
                            </p>

                            <p className="text-white-50">
                                <strong>Credits:</strong>{" "}
                                {payment.credits}
                            </p>

                            <p className="text-white-50">
                                <strong>Amount:</strong>{" "}
                                {Number(payment.value).toFixed(2)}{" "}
                                {payment.currency}
                            </p>

                        </div>

                    )}

                </div>

            </main>


            {/* =============================================
                FOOTER
            ============================================= */}

            <footer
                className="py-3"
                style={{
                    width: "100%",
                    backgroundColor: "#03111D"
                }}
            >

                <div className="container-fluid">

                    <div
                        className="
                            d-flex
                            justify-content-center
                            align-items-center
                            gap-3
                            flex-wrap
                        "
                    >

                        <img
                            src="/logo-apps4green.png"
                            alt="Apps For Green"
                            style={{
                                height: "30px"
                            }}
                        />

                        <span className="text-white-50 small">
                            © 2026 Apps For Green
                        </span>

                        <span className="text-white-50">
                            ·
                        </span>

                        <a
                            href="https://www.apps4green.com"
                            className="text-primary text-decoration-none small"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            www.apps4green.com
                        </a>

                    </div>

                </div>

            </footer>

        </div>

    );
}

export default PaymentSuccess;