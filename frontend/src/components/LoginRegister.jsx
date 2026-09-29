import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import pvHeroIntl from "../assets/pv-hero-intl.jpg";


function LoginRegister({ onForgotPassword }) {

    const {
        signIn,
        signUp
    } = useAuth();


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

            const {
                data,
                error
            } = await signIn(
                loginEmail,
                loginPassword
            );


            if (error) {

                setLoginError(
                    error.message
                );

            } else {

                // =====================================================
                // GOOGLE ANALYTICS 4 - LOGIN SUCCESS
                // =====================================================

                if (
                    typeof window.gtag === "function"
                ) {

                    window.gtag(
                        "event",
                        "login_success"
                    );

                }


                setLoginMessage(
                    "Login successful!"
                );


                console.log(
                    "USER:",
                    data?.user
                );

            }

        } catch (err) {

            setLoginError(
                err.message ||
                "Login failed."
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


        // =====================================================
        // GOOGLE ANALYTICS 4 - REGISTRATION START
        // =====================================================

        if (
            typeof window.gtag === "function"
        ) {

            window.gtag(
                "event",
                "registration_start"
            );

        }


        setRegisterError("");
        setRegisterMessage("");
        setRegisterLoading(true);


        if (
            registerPassword !== confirmPassword
        ) {

            setRegisterError(
                "The passwords do not match."
            );

            setRegisterLoading(false);

            return;

        }


        try {

            // ---------------------------------------------
            // Supabase Auth
            // ---------------------------------------------

            const {
                data,
                error
            } = await signUp(
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

                const {
                    error: profileError
                } = await supabase
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
                "Registration successful! Please check your email to confirm your account."
            );


            setName("");
            setCompany("");
            setRegisterEmail("");
            setRegisterPassword("");
            setConfirmPassword("");


        } catch (err) {

            setRegisterError(
                err.message ||
                "Registration failed."
            );

        } finally {

            setRegisterLoading(false);

        }

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#03111D",
                backgroundImage: `
                    linear-gradient(
                        rgba(255, 255, 255, 0),
                        rgba(255, 255, 255, 0)
                    ),
                    url(${pvHeroIntl})
                `,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed"
            }}
        >

            <div className="container mt-4 mb-5 min-vh-100">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className="d-flex align-items-center mb-4"
                    style={{
                        gap: "20px",
                        marginLeft: "4px",
                        marginTop: "20px"
                    }}
                >

                    {/* Home Button */}

                    <a
                        href="https://www.pv-valuator.com/"
                        className="btn btn-primary text-white"
                    >

                        <i className="bi bi-arrow-left me-2"></i>

                        Home

                    </a>


                    {/* Title + Description */}

                    <div className="d-flex flex-column">

                        <div
                            className="d-flex align-items-center"
                            style={{
                                gap: "10px"
                            }}
                        >

                            <span className="h1 mb-0 fw-bold text-primary">
                                PV-Valuator
                            </span>

                            <span className="badge bg-info fs-6">
                                PRO
                            </span>

                        </div>


                        <small className="text-white-50 fst-italic fs-6">
                            Professional Financial Analysis for Photovoltaic Systems
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

                        <div className="card shadow rounded-4">

                            <div className="card-body p-3">

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
                                                setLoginEmail(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="email@example.com"
                                            required
                                        />

                                    </div>


                                    {/* Password */}

                                    <div className="mb-2">

                                        <label className="form-label">
                                            Password
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
                                                    setLoginPassword(
                                                        e.target.value
                                                    )
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

                                                {
                                                    showLoginPassword
                                                        ? "🙈"
                                                        : "👁️"
                                                }

                                            </button>

                                        </div>

                                    </div>


                                    {/* Forgot Password */}

                                    <div className="mb-3">

                                        <button
                                            type="button"
                                            className="btn btn-link p-0"
                                            onClick={onForgotPassword}
                                        >
                                            Forgot your password?
                                        </button>

                                    </div>


                                    {/* Login Button */}

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={loginLoading}
                                    >

                                        {
                                            loginLoading
                                                ? "Signing in..."
                                                : "Sign In"
                                        }

                                    </button>

                                </form>


                                {/* Error */}

                                {loginError && (

                                    <div className="alert alert-danger mt-3 mb-0">

                                        {loginError}

                                    </div>

                                )}


                                {/* Success */}

                                {loginMessage && (

                                    <div className="alert alert-success mt-3 mb-0">

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

                        <div className="card shadow rounded-4 h-100">

                            <div className="card-body p-4">

                                <h2
                                    className="mb-2"
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "500"
                                    }}
                                >
                                    📝 Create Account
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

                                    New to{" "}

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

                                    ?

                                    Create your account now.

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
                                                setName(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>


                                    {/* Company */}

                                    <div className="mb-3">

                                        <label className="form-label">
                                            Company
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={company}
                                            onChange={(e) =>
                                                setCompany(
                                                    e.target.value
                                                )
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
                                                setRegisterEmail(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>


                                    {/* Password */}

                                    <div className="mb-3">

                                        <label className="form-label">
                                            Password
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

                                                {
                                                    showRegisterPassword
                                                        ? "🙈"
                                                        : "👁️"
                                                }

                                            </button>

                                        </div>

                                    </div>


                                    {/* Confirm Password */}

                                    <div className="mb-4">

                                        <label className="form-label">
                                            Confirm Password
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

                                                {
                                                    showConfirmPassword
                                                        ? "🙈"
                                                        : "👁️"
                                                }

                                            </button>

                                        </div>

                                    </div>


                                    {/* Register Button */}

                                    <button
                                        type="submit"
                                        className="btn btn-success w-100"
                                        disabled={registerLoading}
                                    >

                                        {
                                            registerLoading
                                                ? "Creating account..."
                                                : "Create Account"
                                        }

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
{/* =================================================
                FOOTER
            ================================================= */}

            <footer
                className="py-3"
                style={{
                    backgroundColor: "#03111D"
                }}
            >

                <div className="container">

                    <div className="d-flex justify-content-center align-items-center gap-3">

                        <img
                            src="/logo-apps4green.png"
                            alt="Apps For Green"
                            style={{
                                height: "30px"
                            }}
                        />

                        <span className="text-white-50 small">
                            © 2026 Apps For Green
                        </span>

                        <span className="text-white-50">
                            ·
                        </span>

                        <a
                            href="https://www.apps4green.com"
                            className="text-primary text-decoration-none small"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            www.apps4green.com
                        </a>

                    </div>

                </div>

            </footer>
        </div>

    );

}


export default LoginRegister;