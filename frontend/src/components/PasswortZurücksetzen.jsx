import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function PasswortZurücksetzen({ onCancel, onPasswordUpdated }) {

    // =====================================================
    // MODE
    // =====================================================

    const [mode, setMode] = useState("request");

    // =====================================================
    // REQUEST
    // =====================================================

    const [email, setEmail] = useState("");

    // =====================================================
    // NEW PASSWORD
    // =====================================================

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // =====================================================
    // GENERAL
    // =====================================================

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // =====================================================
    // DETECT PASSWORD RECOVERY
    // =====================================================

    useEffect(() => {

        const handleAuthChange = (event) => {

            console.log(
                "Supabase Auth Event:",
                event
            );

            if (event === "PASSWORD_RECOVERY") {

                setMode("update");

                setError("");
                setMessage("");

            }
        };

        const {
            data: {
                subscription
            }
        } = supabase.auth.onAuthStateChange(
            handleAuthChange
        );

        return () => {

            subscription.unsubscribe();

        };

    }, []);

    // =====================================================
    // SEND RESET EMAIL
    // =====================================================

    const handleResetRequest = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        try {

            const redirectUrl =
                `${window.location.origin}/passwort-zuruecksetzen`;

            const {
                error
            } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: redirectUrl
                }
            );

            if (error) {

                setError(
                    error.message
                );

            } else {

                setMessage(
                    "Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts per E-Mail gesendet."
                );

            }

        } catch (err) {

            setError(
                err.message ||
                "Fehler beim Senden der E-Mail."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // UPDATE PASSWORD
    // =====================================================

    const handleUpdatePassword = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");

        if (password !== confirmPassword) {

            setError(
                "Die Passwörter stimmen nicht überein."
            );

            return;
        }

        if (password.length < 6) {

            setError(
                "Das Passwort muss mindestens 6 Zeichen enthalten."
            );

            return;
        }

        setLoading(true);

        try {

            const {
                error
            } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {

                setError(
                    error.message
                );

                return;
            }

            setMessage(
                "Ihr Passwort wurde erfolgreich geändert."
            );

            setPassword("");
            setConfirmPassword("");

            // ---------------------------------------------
            // Nach kurzer Anzeige zurück zum Login
            // ---------------------------------------------

            setTimeout(() => {

                if (onPasswordUpdated) {

                    onPasswordUpdated();

                }

            }, 1800);

        } catch (err) {

            setError(
                err.message ||
                "Fehler beim Ändern des Passworts."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // REQUEST SCREEN
    // =====================================================

    if (mode === "request") {

        return (

            <div
                className="container"
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    paddingTop: "120px"
                }}
            >

                <div
                    className="card shadow rounded-4"
                    style={{
                        width: "420px"
                    }}
                >

                    <div className="card-body p-4">

                        <h2
                            className="mb-2"
                            style={{
                                fontSize: "22px",
                                fontWeight: "500"
                            }}
                        >
                            Setzen Sie Ihr Passwort zurück
                        </h2>

                        <hr
                            style={{
                                borderTop: "1px solid #222",
                                marginTop: "5px",
                                marginBottom: "28px"
                            }}
                        />


                        <p
                            className="fw-bold"
                            style={{
                                fontSize: "14px"
                            }}
                        >
                            Bitte geben Sie Ihre E-Mail-Adresse in das
                            untenstehende Feld ein.
                        </p>


                        <div className="mb-3">

                            <label className="form-label">
                                Ihre E-Mail-Adresse
                            </label>

                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />

                        </div>


                        <p
                            className="text-muted"
                            style={{
                                fontSize: "12px",
                                lineHeight: "1.25"
                            }}
                        >
                            Wir senden Ihnen einen Link zum Zurücksetzen
                            Ihres Passworts an die hinterlegte
                            E-Mail-Adresse.
                        </p>


                        {error && (

                            <div className="alert alert-danger mt-3">
                                {error}
                            </div>

                        )}


                        {message && (

                            <div className="alert alert-success mt-3">
                                {message}
                            </div>

                        )}


                        <div
                            className="d-flex gap-2 mt-4"
                        >

                            <button
                                type="button"
                                className="btn btn-secondary w-50"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Abbrechen
                            </button>


                            <button
                                type="button"
                                className="btn btn-primary w-50"
                                onClick={handleResetRequest}
                                disabled={loading}
                            >

                                {loading
                                    ? "Senden..."
                                    : "Passwort zurücksetzen"}

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        );
    }

    // =====================================================
    // NEW PASSWORD SCREEN
    // =====================================================

    return (

        <div
            className="container"
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: "120px"
            }}
        >

            <div
                className="card shadow rounded-4"
                style={{
                    width: "420px"
                }}
            >

                <div className="card-body p-4">

                    <h2
                        className="mb-2"
                        style={{
                            fontSize: "22px",
                            fontWeight: "500"
                        }}
                    >
                        Neues Passwort festlegen
                    </h2>

                    <hr
                        style={{
                            borderTop: "1px solid #222",
                            marginTop: "5px",
                            marginBottom: "28px"
                        }}
                    />


                    {/* Passwort */}

                    <div className="mb-3">

                        <label className="form-label">
                            Passwort
                        </label>

                        <div className="input-group">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                className="form-control"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
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
                                {showPassword
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


                    {error && (

                        <div className="alert alert-danger">
                            {error}
                        </div>

                    )}


                    {message && (

                        <div className="alert alert-success">
                            {message}
                        </div>

                    )}


                    <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleUpdatePassword}
                        disabled={loading}
                    >

                        {loading
                            ? "Speichern..."
                            : "Passwort speichern"}

                    </button>

                </div>

            </div>

        </div>

    );
}

export default PasswortZurücksetzen;