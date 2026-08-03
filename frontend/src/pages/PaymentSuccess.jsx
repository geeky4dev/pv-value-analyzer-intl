import React from "react";
import { useNavigate } from "react-router-dom";


function PaymentSuccess() {


    const navigate = useNavigate();


    return (

        <div className="container mt-5 text-center">


            <h2>
                ✅ Zahlung erfolgreich
            </h2>


            <p className="mt-3">
                Vielen Dank für Ihren Kauf.
            </p>


            <button
                className="btn btn-primary mt-3"
                onClick={() => navigate("/")}
            >
                Zurück zur Hauptseite
            </button>


        </div>

    );

}


export default PaymentSuccess;