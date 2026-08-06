import React from "react";


function PaymentSuccess() {


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

                PV Valuator

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


        </div>

    );

}


export default PaymentSuccess;