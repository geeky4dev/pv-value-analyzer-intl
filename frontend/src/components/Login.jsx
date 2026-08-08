// frontend/src/components/Login.jsx
import React, {
    useEffect,
    useState
} from "react";

import UserMenu from "../components/UserMenu.jsx";

import { useAuth } from "../context/AuthContext";


function Login() {


    const { signIn } = useAuth();


    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);


    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);





    const handleLogin = async (e) => {


        e.preventDefault();


        setError("");

        setMessage("");

        setLoading(true);




        const { data, error } = await signIn(

            email,

            password

        );





        if (error) {


            setError(error.message);


        } else {


            setMessage(
                "Login erfolgreich!"
            );


            console.log(
                "USER:",
                data.user
            );


        }





        setLoading(false);


    };






    return (



        <div className="container mt-5">





            {/* Startseite Button */}


            <div className="d-flex justify-content-center mt-4 mb-4">


                <a

                    href="https://www.pv-valuator.de/"

                    className="btn btn-primary text-white"

                >


                    <i className="bi bi-arrow-left me-2 text-white"></i>


                    <span className="text-white">

                        Startseite

                    </span>


                </a>



            </div>









            <div className="row justify-content-center">





                <div className="col-md-5 col-lg-4">





                    <div className="card shadow-lg rounded-4">





                        <div className="card-body p-5">





                            <h2 className="text-center text-primary fw-bold mb-2">

                                PV Valuator

                                <span className="badge bg-info ms-2">
                                    PRO
                                </span>

                            </h2>


                            <p className="text-center text-muted mb-4">

                                Professionelle Wirtschaftlichkeitsanalyse für Photovoltaikanlagen

                            </p>


                            <h3 className="text-center mb-4">

                                🔐 Login

                            </h3>








                            <form onSubmit={handleLogin}>


                                


                                {/* Email */}


                                <div className="mb-3">



                                    <label className="form-label">

                                        Email

                                    </label>




                                    <input


                                        type="email"


                                        className="form-control"


                                        value={email}


                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }


                                        placeholder="email@example.com"


                                        required


                                    />


                                </div>









                                {/* Passwort */}



                                <div className="mb-3">



                                    <label className="form-label">


                                        Passwort


                                    </label>






                                    <div className="input-group">





                                        <input


                                            type={
                                                showPassword
                                                ?
                                                "text"
                                                :
                                                "password"
                                            }


                                            className="form-control"


                                            value={password}


                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }


                                            placeholder="********"


                                            required


                                        />






                                        <button


                                            type="button"


                                            className="btn btn-outline-secondary"


                                            onClick={() =>
                                                setShowPassword(
                                                    !showPassword
                                                )
                                            }


                                        >


                                            {

                                                showPassword

                                                ?

                                                "🙈"

                                                :

                                                "👁️"

                                            }


                                        </button>





                                    </div>



                                </div>









                                {/* Login Button */}



                                <button


                                    type="submit"


                                    className="btn btn-primary w-100"


                                    disabled={loading}


                                >



                                    {

                                        loading

                                        ?

                                        "Anmelden..."

                                        :

                                        "Einloggen"


                                    }



                                </button>






                            </form>









                            {

                                error &&



                                <div className="alert alert-danger mt-3">


                                    {error}


                                </div>



                            }









                            {

                                message &&



                                <div className="alert alert-success mt-3">


                                    {message}


                                </div>



                            }









                        </div>



                    </div>





                </div>





            </div>





        </div>



    );


}



export default Login;