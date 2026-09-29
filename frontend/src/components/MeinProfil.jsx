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

        <div className="container mt-4 min-vh-100">

            {/* ==========================================
                COMMON CONTENT CONTAINER
                ========================================== */}

            <div
                className="mx-auto"
                style={{
                    width: "100%",
                    maxWidth: "900px"
                }}
            >

                {/* Home Button */}

                <div className="d-flex justify-content-end mb-4">

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


                {/* Profile Card */}

                <Card className="shadow-sm">

                    <Card.Body>


                        <Card.Title className="mb-4 text-primary">

                            👤 My Profile

                        </Card.Title>


                        <hr />


                        {/* Personal Information */}

                        <h6 className="text-primary">

                            Personal Information

                        </h6>


                        <p>

                            <strong>Name:</strong>

                            {" "}

                            {profile?.name || "-"}

                        </p>


                        <p>

                            <strong>Email:</strong>

                            {" "}

                            {user?.email || "-"}

                        </p>


                        <p>

                            <strong>Company:</strong>

                            {" "}

                            {profile?.company || "-"}

                        </p>


                        <hr />


                        {/* Account Information */}

                        <h6 className="text-primary">

                            Account Information

                        </h6>


                        <p>

                            <strong>Registered Since:</strong>

                            {" "}

                            {
                                profile?.created_at
                                ?
                                new Date(
                                    profile.created_at
                                ).toLocaleDateString(
                                    "en-US"
                                )
                                :
                                "-"
                            }

                        </p>


                        <p>

                            <strong>Current Plan:</strong>

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
                                Available Credits:
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

        </div>

    );

};


export default MeinProfil;