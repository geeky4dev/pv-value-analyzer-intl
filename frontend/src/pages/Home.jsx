import React from "react";
import UserMenu from "../components/UserMenu.jsx";


function Home() {


    return (

        <div className="container mt-5">


            {/*<div className="d-flex justify-content-end">

                <UserMenu />

            </div>
            */}

            <div className="d-flex justify-content-between align-items-center">

                <a
                    href="https://www.apps4green.com/"
                    className="btn btn-primary"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Startseite
                </a>

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