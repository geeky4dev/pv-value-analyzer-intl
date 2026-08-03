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




    const plans = [


        {
            name: "Starter",
            credits: 10,
            package: "starter",
            button: "Starter kaufen"
        },


        {
            name: "Professional",
            credits: 25,
            package: "professional",
            button: "Professional kaufen"
        },


        {
            name: "Expert",
            credits: 50,
            package: "expert",
            button: "Expert kaufen"
        },


        {
            name: "Business",
            credits: 100,
            package: "business",
            button: "Business kaufen"
        }


    ];





    return (


        <div className="container mt-4">



            <div className="row g-4">



                {
                    plans.map((plan) => (


                        <div

                            className="col-12"

                            key={plan.package}

                        >


                            <div className="card p-4 shadow h-100">


                                <h5>

                                    {plan.name}

                                </h5>



                                <p>

                                    {plan.credits} Credits

                                </p>



                                <button

                                    className="btn btn-primary"

                                    disabled={loading}

                                    onClick={() =>
                                        buyPackage(plan.package)
                                    }

                                >


                                    {

                                        loading

                                        ?

                                        "Weiter..."

                                        :

                                        plan.button

                                    }


                                </button>



                            </div>


                        </div>


                    ))

                }


            </div>



        </div>


    );


}



export default CreditPlans;