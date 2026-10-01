import React from "react";

function PaymentCancel() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#03111D"
            }}
        >

            {/* =============================================
                MAIN CONTENT
            ============================================= */}
            <main className="flex-grow-1">

                <div className="container mt-5 text-center">

                    {/* Home Button */}
                    <div className="d-flex justify-content-center mt-5 mb-4">

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


                    {/* Payment Cancelled */}
                    <h3 className="text-warning mt-4">
                        ⚠️ Payment Cancelled
                    </h3>


                    <p
                        className="mt-3"
                        style={{ color: "rgba(255, 255, 255, 0.2)" }}
                    >
                        The purchase was not completed.
                    </p>

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

export default PaymentCancel;