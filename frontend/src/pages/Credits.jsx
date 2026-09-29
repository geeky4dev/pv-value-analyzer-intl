import React from "react";

import CreditPlans from "../components/CreditPlans";


function Credits() {

    return (

        <div className="container mt-4 min-vh-100">


            {/* Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">


                <div>

                    <h3 className="text-primary">
                        💳 Buy Credits
                    </h3>


                    <p className="mb-4 text-white-50 fst-italic text-center fs-5">
                        
                        Choose your credit plan.
                    </p>


                </div>


                {/* Home Button */}

                <a
                    href="/"
                    className="btn btn-primary text-white"
                >

                    <i className="bi bi-arrow-left me-2 text-white"></i>

                    <span className="text-white">
                        Home
                    </span>

                </a>


            </div>


            <CreditPlans />


        </div>

    );

}


export default Credits;