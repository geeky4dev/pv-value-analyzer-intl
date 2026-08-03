import React from "react";
import { Link } from "react-router-dom";


function PaymentCancel() {


    return (

        <div className="container mt-5 text-center">


            <h2>
                Zahlung abgebrochen
            </h2>


            <p className="lead">
                Der Kauf wurde nicht abgeschlossen.
            </p>


            <Link
                to="/credits"
                className="btn btn-secondary mt-3"
            >
                Zurück zu Credits
            </Link>


        </div>

    );


}


export default PaymentCancel;