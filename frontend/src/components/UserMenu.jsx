import React, { useState, useEffect, useRef } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";

import { useNavigate } from "react-router-dom";


function UserMenu() {


    const {
        user,
        profile,
        signOut
    } = useAuth();


    const {
        credits,
        loadingCredits
    } = useCredits();



    const [open, setOpen] = useState(false);


    const menuRef = useRef();

    const navigate = useNavigate();

    // Cerrar menú al hacer click fuera

    useEffect(() => {


        const handleClickOutside = (event) => {


            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {

                setOpen(false);

            }


        };


        document.addEventListener(
            "mousedown",
            handleClickOutside
        );


        return () => {


            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );


        };


    }, []);




    const handleLogout = async () => {


        await signOut();


        setOpen(false);


    };




    return (

        <div
            className="dropdown"
            ref={menuRef}
        >


            <button

                className="
                    btn 
                    btn-light 
                    dropdown-toggle 
                    d-flex 
                    align-items-center 
                    gap-2
                "

                onClick={() => setOpen(!open)}

                aria-expanded={open}

            >


                <i className="bi bi-person-circle fs-4"></i>


                <span>


                    {
                        profile?.name ||
                        user?.email ||
                        "User"
                    }


                </span>


            </button>





            {
                open && (


                    <ul

                        className="
                            dropdown-menu 
                            show 
                            shadow
                        "

                        style={{

                            right: 0,

                            left: "auto",

                            minWidth: "240px"

                        }}

                    >



                        <li>


                            <span className="dropdown-item-text">


                                <strong>


                                    {
                                        profile?.name ||
                                        user?.email
                                    }


                                </strong>



                                <br />



                                <small>


                                    {
                                        profile?.company ||
                                        "Keine Firma"
                                    }


                                </small>



                            </span>


                        </li>





                        <li>

                            <hr className="dropdown-divider"/>

                        </li>


                        <li>


                            <button

                                className="dropdown-item"

                                onClick={() => {

                                    navigate("/profil");

                                    setOpen(false);

                                }}

                            >


                                <i className="bi bi-person"></i>

                                {" "}

                                Mein Profil


                            </button>


                        </li>



                        <li>

                            <Link
                                to="/reports"
                                className="dropdown-item"
                                onClick={() => setOpen(false)}
                            >

                                <i className="bi bi-file-earmark-text"></i>

                                {" "}

                                Meine Reports

                            </Link>

                        </li>



                        <li>


                            <span className="dropdown-item-text">


                                <i className="bi bi-credit-card"></i>


                                {" "}


                                Credits:


                                <strong className="ms-2">

                                    {
                                        loadingCredits
                                        ?
                                        "..."
                                        :
                                        credits ?? 0
                                    }

                                </strong>



                            </span>


                        </li>





                        <li>


                            <hr className="dropdown-divider"/>


                        </li>





                        <li>


                            <button

                                className="
                                    dropdown-item 
                                    text-danger
                                "

                                onClick={handleLogout}

                            >


                                <i className="bi bi-box-arrow-right"></i>


                                {" "}


                                Abmelden



                            </button>



                        </li>





                    </ul>


                )

            }



        </div>


    );


}



export default UserMenu;