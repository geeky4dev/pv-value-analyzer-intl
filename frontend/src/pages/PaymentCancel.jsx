import React from "react";


function PaymentCancel() {


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
                onClick={() => {
                    console.log("BUTTON PAYMENT CANCEL CLICKED");
                    window.location.href = "/";
                }}
            >
                Zurück zur Hauptseite
            </button>


        </div>

    );

}


export default PaymentCancel;