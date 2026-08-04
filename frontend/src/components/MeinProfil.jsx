import React from "react";
import { Card } from "react-bootstrap";

import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";



const MeinProfil = () => {



    const {
        user,
        profile
    } = useAuth();



    const {
        credits,
        loadingCredits
    } = useCredits();





    return (


        <div className="container mt-4">



            {/* Startseite Button */}

            <div className="d-flex justify-content-end mb-4">


                <a

                    href="https://www.apps4green.com/"

                    className="btn btn-primary text-white"

                >

                    <i className="bi bi-arrow-left me-2 text-white"></i>


                    <span className="text-white">

                        Startseite

                    </span>


                </a>



            </div>






            <Card className="shadow-sm">



                <Card.Body>




                    <Card.Title className="mb-4">


                        👤 Mein Profil


                    </Card.Title>





                    <hr />






                    {/* Persönliche Daten */}


                    <h6 className="text-primary">

                        Persönliche Daten

                    </h6>





                    <p>

                        <strong>Name:</strong>

                        {" "}

                        {profile?.name || "-"}


                    </p>





                    <p>

                        <strong>E-Mail:</strong>

                        {" "}

                        {user?.email || "-"}


                    </p>





                    <p>

                        <strong>Firma:</strong>

                        {" "}

                        {profile?.company || "-"}


                    </p>






                    <hr />






                    {/* Account Informationen */}


                    <h6 className="text-primary">

                        Account Informationen

                    </h6>






                    <p>

                        <strong>Registriert seit:</strong>

                        {" "}

                        {


                            profile?.created_at

                            ?

                            new Date(
                                profile.created_at
                            ).toLocaleDateString(
                                "de-DE"
                            )

                            :

                            "-"


                        }


                    </p>






                    <p>

                        <strong>Aktueller Plan:</strong>

                        {" "}

                        {


                            profile?.current_plan

                            ?

                            profile.current_plan

                            :

                            "-"


                        }


                    </p>







                    <hr />






                    {/* Credits */}



                    <h6 className="text-primary">

                        Credits

                    </h6>






                    <p>


                        <strong>

                            Verfügbare Credits:

                        </strong>


                        {" "}



                        {


                            loadingCredits

                            ?

                            "..."

                            :

                            credits ?? 0


                        }



                    </p>






                </Card.Body>



            </Card>



        </div>


    );


};



export default MeinProfil;