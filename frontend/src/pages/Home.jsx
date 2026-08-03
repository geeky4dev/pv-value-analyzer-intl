import React from "react";
import UserMenu from "../components/UserMenu.jsx";


function Home() {


    return (

        <div className="container mt-5">


            <div className="d-flex justify-content-end">

                <UserMenu />

            </div>


            <h1 className="text-center mt-5">

                PV-Wirtschaftlichkeitsanalyse System PRO

            </h1>


            <p className="text-center text-muted">

                Willkommen zurück.

            </p>


            <div className="text-center mt-4">


                <a
                    href="/analyse"
                    className="btn btn-primary"
                >

                    Neue Analyse starten

                </a>


            </div>


        </div>

    );

}


export default Home;