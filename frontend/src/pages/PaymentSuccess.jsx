import React from "react";


function PaymentSuccess() {


    return (

        <div className="container mt-5 text-center">


            {/* Startseite Button */}

            <div className="d-flex justify-content-center mt-5 mb-4">

                <a
                    href="https://www.apps4green.com/"
                    className="btn btn-primary text-white"
                >

                    <i className="bi bi-arrow-left me-2 text-white"></i>

                    <span className="text-white">
                        Startseite
                    </span>

                </a>

            </div>




            <h2 className="text-success">

                ✅ Zahlung erfolgreich

            </h2>




            <p className="mt-3">

                Vielen Dank für Ihren Kauf.

            </p>




            <p className="text-muted">

                Ihre Credits wurden Ihrem Konto gutgeschrieben.

            </p>



        </div>

    );

}


export default PaymentSuccess;