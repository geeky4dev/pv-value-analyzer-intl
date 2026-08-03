// frontend/src/components/Register.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function Register() {

    const { signUp } = useAuth();

    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        try {

            // Crear usuario en Supabase Auth
            const { data, error } = await signUp(
                email,
                password
            );

            if (error) {

                setError(error.message);
                setLoading(false);
                return;

            }

            // Crear perfil en la tabla profiles
            if (data.user) {

                const { error: profileError } = await supabase
                    .from("profiles")
                    .insert({

                        id: data.user.id,
                        email: email,
                        name: name,
                        company: company

                    });

                if (profileError) {

                    setError(profileError.message);
                    setLoading(false);
                    return;

                }

            }

            setMessage(
                "Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mail zur Bestätigung."
            );

            setName("");
            setCompany("");
            setEmail("");
            setPassword("");

        } catch (err) {

            setError(err.message);

        }

        setLoading(false);

    };

    return (

        <div className="container mt-5">

            <div className="row justify-content-center">

                <div className="col-md-6">

                    <div className="card shadow rounded-4">

                        <div className="card-body p-4">

                            <h3 className="text-center mb-4">

                                📝 Neues Konto erstellen

                            </h3>

                            <form onSubmit={handleRegister}>

                                <div className="mb-3">

                                    <label className="form-label">

                                        Name

                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />

                                </div>

                                <div className="mb-3">

                                    <label className="form-label">

                                        Firma

                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                    />

                                </div>

                                <div className="mb-3">

                                    <label className="form-label">

                                        Email

                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />

                                </div>

                                <div className="mb-4">

                                    <label className="form-label">

                                        Passwort

                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />

                                </div>

                                <button
                                    className="btn btn-success w-100"
                                    disabled={loading}
                                >

                                    {
                                        loading
                                            ? "Registrierung..."
                                            : "Registrieren"
                                    }

                                </button>

                            </form>

                            {
                                error && (

                                    <div className="alert alert-danger mt-3">

                                        {error}

                                    </div>

                                )
                            }

                            {
                                message && (

                                    <div className="alert alert-success mt-3">

                                        {message}

                                    </div>

                                )
                            }

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Register;