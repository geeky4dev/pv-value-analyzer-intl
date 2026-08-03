import React from "react";
import { Link } from "react-router-dom";


function PaymentSuccess() {


    return (

        <div className="container mt-5 text-center">


            <h2>
                ✅ Zahlung erfolgreich
            </h2>


            <p className="lead">
                Vielen Dank für Ihren Kauf.
            </p>


            <p>
                Ihre Credits wurden Ihrem Konto gutgeschrieben.
            </p>


            <Link
                to="/"
                className="btn btn-primary mt-3"
            >
                Zur Hauptseite
            </Link>


        </div>

    );


}


export default PaymentSuccess;