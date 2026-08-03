import React from "react";


function PaymentSuccess() {


    return (

        <div className="container mt-5 text-center">


            <h2 className="text-success">

                ✅ Zahlung erfolgreich

            </h2>


            <p className="mt-3">

                Vielen Dank für Ihren Kauf.

            </p>


            <p className="text-muted">

                Ihre Credits wurden Ihrem Konto gutgeschrieben.

            </p>



            <button

                className="btn btn-primary mt-3"

                onClick={() => window.location.href = "/"}

            >

                Zurück zur Hauptseite

            </button>


        </div>

    );

}


export default PaymentSuccess;