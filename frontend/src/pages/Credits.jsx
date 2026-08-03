import React from "react";

import { Link } from "react-router-dom";

import CreditPlans from "../components/CreditPlans";


function Credits() {


    return (

        <div className="container mt-4">


            <div className="d-flex justify-content-between align-items-center mb-4">


                <div>

                    <h3>
                        💳 Credits kaufen
                    </h3>


                    <p className="text-muted mb-0">
                        Wählen Sie Ihr Credit-Paket.
                    </p>

                </div>



                <Link

                    to="/"

                    className="btn btn-outline-secondary"

                >

                    <i className="bi bi-arrow-left"></i>

                    {" "}

                    Zurück zur Hauptseite

                </Link>


            </div>



            <CreditPlans />


        </div>

    );


}


export default Credits;