import React from "react";


function PaymentCancel() {


    return (

        <div className="container mt-5 text-center">


            {/* Startseite Button */}

            <div className="d-flex justify-content-center mt-5 mb-4">

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




            <h2 className="text-primary fw-bold">

                PV Valuator

                <span className="badge bg-info ms-2">
                    PRO
                </span>

            </h2>


            <p className="text-muted fst-italic mt-2">
                Professionelle Wirtschaftlichkeitsanalyse
                für Photovoltaikanlagen
            </p>


            <h3 className="text-warning mt-4">

                ⚠️ Zahlung abgebrochen

            </h3>


            <p className="mt-3">

                Der Kauf wurde nicht abgeschlossen.

            </p>



        </div>

    );

}


export default PaymentCancel;