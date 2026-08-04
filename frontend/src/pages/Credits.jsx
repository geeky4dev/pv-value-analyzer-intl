import React from "react";

import CreditPlans from "../components/CreditPlans";


function Credits() {


    return (

        <div className="container mt-4">


            {/* Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">



                <div>

                    <h3>
                        💳 Credits kaufen
                    </h3>


                    <p className="text-muted mb-0">
                        Wählen Sie Ihr Credit-Paket.
                    </p>


                </div>





                {/* Startseite Button */}

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




            <CreditPlans />



        </div>

    );


}


export default Credits;