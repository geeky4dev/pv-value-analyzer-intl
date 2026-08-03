import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";


function Login() {

    const { signIn } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

            setMessage("Login erfolgreich!");

            console.log("USER:", data.user);

        }


        setLoading(false);

    };



    return (

        <div className="container">

            <div className="row justify-content-center align-items-center"
                 style={{minHeight:"80vh"}}>


                <div className="col-md-5 col-lg-4">


                    <div className="card shadow-lg rounded-4">


                        <div className="card-body p-5">


                            <h3 className="text-center mb-4">
                                🔐 Login
                            </h3>



                            <form onSubmit={handleLogin}>


                                <div className="mb-3">

                                    <label className="form-label">
                                        Email
                                    </label>


                                    <input

                                        type="email"

                                        className="form-control"

                                        value={email}

                                        onChange={(e)=>
                                            setEmail(e.target.value)
                                        }

                                        placeholder="email@example.com"

                                        required

                                    />


                                </div>




                                <div className="mb-3">


                                    <label className="form-label">

                                        Passwort

                                    </label>


                                    <input

                                        type="password"

                                        className="form-control"

                                        value={password}

                                        onChange={(e)=>
                                            setPassword(e.target.value)
                                        }

                                        placeholder="********"

                                        required

                                    />


                                </div>




                                <button

                                    type="submit"

                                    className="btn btn-primary w-100"

                                    disabled={loading}

                                >

                                    {
                                    loading
                                    ? "Anmelden..."
                                    : "Einloggen"
                                    }

                                </button>



                            </form>




                            {error &&

                                <div className="alert alert-danger mt-3">

                                    {error}

                                </div>

                            }



                            {message &&

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