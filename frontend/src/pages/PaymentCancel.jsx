import React from "react";
import { useNavigate } from "react-router-dom";


function PaymentCancel() {

    const navigate = useNavigate();


    return (

        <div className="container mt-5 text-center">


            <h2 className="text-warning">

                ⚠️ Zahlung abgebrochen

            </h2>


            <p className="mt-3">

                Der Kauf wurde nicht abgeschlossen.

            </p>


            <button

                className="btn btn-primary mt-3"

                onClick={() => navigate("/credits")}

            >

                Zurück zu Credits

            </button>


        </div>

    );

}


export default PaymentCancel;