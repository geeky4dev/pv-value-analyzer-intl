
import React from "react";
import { useNavigate } from "react-router-dom";


function PaymentSuccess() {


    const navigate = useNavigate();


    const handleReturnHome = () => {

        navigate("/", {
            replace: true
        });

    };


    return (

        <div className="container mt-5 text-center">


            <div className="card shadow p-5">


                <h2 className="text-success">

                    ✅ Zahlung erfolgreich

                </h2>



                <p className="mt-3 fs-5">

                    Vielen Dank für Ihren Kauf.

                </p>



                <button

                    className="btn btn-primary mt-4"

                    onClick={handleReturnHome}

                >

                    Zurück zur Hauptseite

                </button>


            </div>


        </div>

    );

}


export default PaymentSuccess;

