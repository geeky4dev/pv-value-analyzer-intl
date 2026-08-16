import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function LoginRegister({ onForgotPassword }) {

    const { signIn, signUp } = useAuth();

    // =====================================================
    // LOGIN
    // =====================================================

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loginMessage, setLoginMessage] = useState("");

    // =====================================================
    // REGISTER
    // =====================================================

    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerError, setRegisterError] = useState("");
    const [registerMessage, setRegisterMessage] = useState("");

    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setLoginError("");
        setLoginMessage("");
        setLoginLoading(true);

        try {

            const { data, error } = await signIn(
                loginEmail,
                loginPassword
            );

            if (error) {

                setLoginError(error.message);

            } else {

                setLoginMessage(
                    "Login erfolgreich!"
                );

                console.log(
                    "USER:",
                    data?.user
                );
            }

        } catch (err) {

            setLoginError(
                err.message || "Login fehlgeschlagen."
            );

        } finally {

            setLoginLoading(false);

        }
    };

    // =====================================================
    // REGISTER
    // =====================================================

    const handleRegister = async (e) => {

        e.preventDefault();

        setRegisterError("");
        setRegisterMessage("");
        setRegisterLoading(true);

        if (registerPassword !== confirmPassword) {

            setRegisterError(
                "Die Passwörter stimmen nicht überein."
            );

            setRegisterLoading(false);

            return;
        }

        try {

            // ---------------------------------------------
            // Supabase Auth
            // ---------------------------------------------

            const { data, error } = await signUp(
                registerEmail,
                registerPassword
            );

            if (error) {

                setRegisterError(
                    error.message
                );

                setRegisterLoading(false);

                return;
            }

            // ---------------------------------------------
            // Profile
            // ---------------------------------------------

            if (data?.user) {

                const { error: profileError } =
                    await supabase
                        .from("profiles")
                        .insert({
                            id: data.user.id,
                            email: registerEmail,
                            name: name,
                            company: company
                        });

                if (profileError) {

                    setRegisterError(
                        profileError.message
                    );

                    setRegisterLoading(false);

                    return;
                }
            }

            // ---------------------------------------------
            // Success
            // ---------------------------------------------

            setRegisterMessage(
                "Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mail zur Bestätigung."
            );

            setName("");
            setCompany("");
            setRegisterEmail("");
            setRegisterPassword("");
            setConfirmPassword("");

        } catch (err) {

            setRegisterError(
                err.message || "Registrierung fehlgeschlagen."
            );

        } finally {

            setRegisterLoading(false);

        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="container mt-4 mb-5">

            {/* =================================================
                HEADER
            ================================================= */}

            <div
            className="d-flex align-items-center mb-4" 
            style={{ gap: "20px", marginLeft: "4px", marginTop: "50px" }}
        >
            {/* Botón Startseite */}
            <a
                href="https://www.pv-valuator.de/"
                className="btn btn-primary text-white"
            >
                <i className="bi bi-arrow-left me-2"></i>
                Startseite
            </a>

            {/* Bloque Título + Descripción apilados verticalmente */}
            <div className="d-flex flex-column">
                
                {/* Título + Badge */}
                <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                    <span className="h1 mb-0 fw-bold text-primary">
                        PV-Valuator
                    </span>
                    <span className="badge bg-info fs-6">
                        PRO
                    </span>
                </div>

                {/* Subtítulo / Descripción justo debajo */}
                <small className="text-muted fst-italic fs-6">
                    Professionelle Wirtschaftlichkeitsanalyse für Photovoltaikanlagen
                </small>

            </div>
        </div>


            {/* =================================================
                TWO COLUMNS
            ================================================= */}

            <div className="row g-4">

                {/* =================================================
                    LOGIN
                ================================================= */}

                <div className="col-md-6">

                    <div
                        className="card shadow rounded-4 h-100"
                    >

                        <div className="card-body p-4">

                            <h2
                                className="mb-2"
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "500"
                                }}
                            >
                                🔐 Login
                            </h2>

                            <hr
                                style={{
                                    borderTop: "1px solid #222",
                                    marginTop: "5px",
                                    marginBottom: "18px"
                                }}
                            />


                            <form onSubmit={handleLogin}>

                                {/* Email */}

                                <div className="mb-3">

                                    <label className="form-label">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        value={loginEmail}
                                        onChange={(e) =>
                                            setLoginEmail(e.target.value)
                                        }
                                        placeholder="email@example.com"
                                        required
                                    />

                                </div>


                                {/* Passwort */}

                                <div className="mb-2">

                                    <label className="form-label">
                                        Passwort
                                    </label>

                                    <div className="input-group">

                                        <input
                                            type={
                                                showLoginPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className="form-control"
                                            value={loginPassword}
                                            onChange={(e) =>
                                                setLoginPassword(e.target.value)
                                            }
                                            placeholder="********"
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() =>
                                                setShowLoginPassword(
                                                    !showLoginPassword
                                                )
                                            }
                                        >
                                            {showLoginPassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                </div>


                                {/* Passwort vergessen */}

                                <div className="mb-4">

                                    <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={onForgotPassword}
                                    >
                                        Haben Sie Ihr Passwort vergessen?
                                    </button>

                                </div>


                                {/* Einloggen */}

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loginLoading}
                                >

                                    {loginLoading
                                        ? "Anmelden..."
                                        : "Einloggen"}

                                </button>


                            </form>


                            {/* Error */}

                            {loginError && (

                                <div className="alert alert-danger mt-3">
                                    {loginError}
                                </div>

                            )}


                            {/* Success */}

                            {loginMessage && (

                                <div className="alert alert-success mt-3">
                                    {loginMessage}
                                </div>

                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    REGISTER
                ================================================= */}

                <div className="col-md-6">

                    <div
                        className="card shadow rounded-4 h-100"
                    >

                        <div className="card-body p-4">

                            <h2
                                className="mb-2"
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "500"
                                }}
                            >
                                📝 Konto erstellen
                            </h2>

                            <hr
                                style={{
                                    borderTop: "1px solid #222",
                                    marginTop: "5px",
                                    marginBottom: "18px"
                                }}
                            />


                            {/* Intro */}

                            <p
                                className="mb-4"
                                style={{
                                    fontSize: "16px"
                                }}
                            >

                                Neu bei{" "}

                                <strong
                                    style={{
                                        color: "#1976d2",
                                        fontSize: "19px"
                                    }}
                                >
                                    PV-Valuator
                                </strong>{" "}

                                <span
                                    className="badge bg-info"
                                    style={{
                                        fontSize: "16px"
                                    }}
                                >
                                    PRO
                                </span>{" "}

                                ? Registrieren Sie sich jetzt schnell
                                für ein Konto.

                            </p>


                            <form onSubmit={handleRegister}>

                                {/* Name */}

                                <div className="mb-3">

                                    <label className="form-label">
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                    />

                                </div>


                                {/* Firma */}

                                <div className="mb-3">

                                    <label className="form-label">
                                        Firma
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company}
                                        onChange={(e) =>
                                            setCompany(e.target.value)
                                        }
                                    />

                                </div>


                                {/* Email */}

                                <div className="mb-3">

                                    <label className="form-label">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        value={registerEmail}
                                        onChange={(e) =>
                                            setRegisterEmail(e.target.value)
                                        }
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
                                                showRegisterPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className="form-control"
                                            value={registerPassword}
                                            onChange={(e) =>
                                                setRegisterPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() =>
                                                setShowRegisterPassword(
                                                    !showRegisterPassword
                                                )
                                            }
                                        >
                                            {showRegisterPassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                </div>


                                {/* Passwort wiederholen */}

                                <div className="mb-4">

                                    <label className="form-label">
                                        Passwort wiederholen
                                    </label>

                                    <div className="input-group">

                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className="form-control"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                        >
                                            {showConfirmPassword
                                                ? "🙈"
                                                : "👁️"}
                                        </button>

                                    </div>

                                </div>


                                {/* Registrieren */}

                                <button
                                    type="submit"
                                    className="btn btn-success w-100"
                                    disabled={registerLoading}
                                >

                                    {registerLoading
                                        ? "Registrierung..."
                                        : "Registrieren"}

                                </button>

                            </form>


                            {/* Error */}

                            {registerError && (

                                <div className="alert alert-danger mt-3">
                                    {registerError}
                                </div>

                            )}


                            {/* Success */}

                            {registerMessage && (

                                <div className="alert alert-success mt-3">
                                    {registerMessage}
                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default LoginRegister;