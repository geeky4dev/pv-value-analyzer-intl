import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";


function CreditPlans() {

    const { user } = useAuth();

    const [loading, setLoading] = useState(false);


    const buyPackage = async (packageName) => {

        try {

            setLoading(true);


            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/stripe/create-checkout-session`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        package: packageName,
                        user_id: user.id,
                        user_email: user.email
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {
                throw new Error(data.error);
            }


            window.location.href = data.checkout_url;


        } catch(error) {

            console.error(error);

            alert(error.message);

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="container mt-4">

            <h3>
                Credits kaufen
            </h3>


            <div className="card p-4 shadow">


                <h5>
                    Starter Paket
                </h5>


                <p>
                    10 Credits
                </p>


                <button

                    className="btn btn-primary"

                    disabled={loading}

                    onClick={() =>
                        buyPackage("starter")
                    }

                >

                    {loading
                        ? "Weiter..."
                        : "Starter kaufen"
                    }

                </button>


            </div>


        </div>

    );

}


export default CreditPlans;