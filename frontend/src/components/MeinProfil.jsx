import React from "react";
import { Card } from "react-bootstrap";

import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";

import { useNavigate } from "react-router-dom";


const MeinProfil = () => {


    const navigate = useNavigate();


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


            {/* Zurück Button */}

            <div className="mb-3">


                <button

                    className="btn btn-secondary"

                    onClick={() => navigate("/")}

                >

                    <i className="bi bi-arrow-left"></i>

                    {" "}

                    Zurück zur Hauptseite


                </button>


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
