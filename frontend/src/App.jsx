import React, {
    useState,
    useEffect
} from "react";

import { useAuth } from "./context/AuthContext";

import LoginRegister from "./components/LoginRegister.jsx";
import PasswortZurücksetzen from "./components/PasswortZurücksetzen.jsx";

import UserMenu from "./components/UserMenu.jsx";

import { useCredits } from "./context/CreditsContext";

import "leaflet/dist/leaflet.css";

import AnlagenDaten from "./components/AnlagenDaten.jsx";
import Buchwert from "./components/Buchwert.jsx";
import Ertragswert from "./components/Ertragswert.jsx";
import Restwert from "./components/Restwert.jsx";
import ReportForm from "./components/ReportForm.jsx";
import BetriebsmodellSelector from "./components/BetriebsmodellSelector.jsx";
import PVGISForm from "./components/PVGISForm.jsx";
import FinanzielleBewertung from "./components/FinanzielleBewertung.jsx";
import Dashboard from "./components/Dashboard.jsx";

import { FinancialProvider } from "./components/FinancialContext.jsx";

import {
    Routes,
    Route
} from "react-router-dom";

import MeineReports from "./components/MeineReports";
import MeinProfil from "./components/MeinProfil.jsx";

import Credits from "./pages/Credits.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentCancel from "./pages/PaymentCancel.jsx";
import Home from "./pages/Home.jsx";


const BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    "http://127.0.0.1:5001";


function App() {

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const {
        user,
        profile,
        loading
    } = useAuth();


    // =====================================================
    // CREDITS
    // =====================================================

    const {
        credits,
        loadingCredits
    } = useCredits();


    // =====================================================
    // APPLICATION STATE
    // =====================================================

    const [formData, setFormData] = useState({

        anlagen: {
            adresse: "",
            plz: "",
            ort: "",
            bundesland: "",
            name: "",
            email: "",
            telefon: "",
            leistung: "",
            inbetriebnahme: "",
            modultyp: "",
            modulhersteller: "",
            modulmodell: "",
            wechselrichtertyp: "",
            wechselrichterhersteller: "",
            wechselrichtermodell: "",
            wechselrichterjahr: "",
            wechselrichteraustausch: false,
            installationsart: "",
            dachneigung: "",
            azimut: "",
            pr: "",
            degradation: "",
            latitude: "",
            longitude: "",
            zustand: "",
            letzteWartung: "",
            wartungsvertrag: false,
            bekannteProbleme: ""
        },

        betriebsmodell: "volleinspeisung",

        pvgis: {
            latitude: "",
            longitude: "",
            anlagengroesse: "",
            production: null,
            spezifischerErtrag: null,
            pr: null
        },

        buchwert: {
            abschreibung: "",
            buchwert: ""
        },

        ertragswert: {
            anlagengroesse: "",
            spezifischerertrag: "",
            performance_ratio: "",
            degradation: "",
            strompreis: "",
            opex: "",
            jahresertrag: "",
            ertragswert: "",
            ertragswertKumuliert: ""
        },

        restwert: {
            zukuenftige_gewinne: 0,
            restwert: 0,
            kostenabschlag: 10,
            verkaufsabschlag: 50,
            wartung: false,
            zustand: "gut",
            pr: 80,
            restlaufzeit: 15,
            marktfaktor: 100
        },

        finanzielleBewertung: {
            npv: "",
            discount_rate: "",
            horizon: "",
            opex: "",
            irr: "",
            interpretation: "",
            cashflows: []
        }

    });


    const [ertragsResult, setErtragsResult] =
        useState(null);


    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
        "APP USER:",
        user
    );

    console.log(
        "APP PROFILE:",
        profile
    );

    console.log(
        "APP LOADING:",
        loading
    );

    console.log(
        "CREDITS:",
        credits,
        "LOADING:",
        loadingCredits
    );


    // =====================================================
    // UPDATE ANLAGEN DATEN
    // =====================================================

    const updateAnlagenData = (data) => {

        setFormData((prev) => ({

            ...prev,

            anlagen: {
                ...prev.anlagen,
                ...data
            },

            pvgis: {
                ...prev.pvgis,

                anlagengroesse:
                    data.leistung ||
                    prev.pvgis.anlagengroesse
            }

        }));

    };


    // =====================================================
    // UPDATE BETRIEBSMODELL
    // =====================================================

    const updateBetriebsmodell = (model) => {

        setFormData((prev) => ({

            ...prev,

            betriebsmodell:
                model ||
                "volleinspeisung"

        }));

    };


    // =====================================================
    // UPDATE PVGIS
    // =====================================================

    const updatePVGIS = (data) => {

        setFormData((prev) => {

            const newSpezErtrag =
                data.spezifischer_ertrag ||
                data.spezifischerErtrag ||
                prev.ertragswert.spezifischerertrag;


            const newProduction =
                data.production ||
                data.annual_production ||
                prev.ertragswert.jahresertrag;


            const currentPR =
                data.pr ??
                prev.ertragswert.performance_ratio ??
                80;


            return {

                ...prev,

                pvgis: {

                    ...prev.pvgis,

                    ...data,

                    spezifischerErtrag:
                        newSpezErtrag,

                    production:
                        newProduction

                },

                anlagen: {

                    ...prev.anlagen,

                    latitude:
                        data.latitude ||
                        prev.anlagen.latitude,

                    longitude:
                        data.longitude ||
                        prev.anlagen.longitude

                },

                ertragswert: {

                    ...prev.ertragswert,

                    anlagengroesse:
                        data.anlagengroesse ||
                        prev.ertragswert.anlagengroesse,

                    spezifischerertrag:
                        newSpezErtrag,

                    performance_ratio:
                        currentPR,

                    production:
                        newProduction,

                    jahresertrag:
                        newProduction

                }

            };

        });

    };


    // =====================================================
    // UPDATE BUCHWERT
    // =====================================================

    const updateBuchwert = (data) => {

        setFormData((prev) => ({

            ...prev,

            buchwert: {

                ...prev.buchwert,

                ...data

            },

            restwert: {

                ...prev.restwert,

                restlaufzeit:
                    Number(data.restlaufzeit) ||
                    prev.restwert.restlaufzeit

            },

            ertragswert: {

                ...prev.ertragswert,

                restlaufzeit:
                    Number(data.restlaufzeit) ||
                    prev.ertragswert.restlaufzeit

            }

        }));

    };


    // =====================================================
    // UPDATE ERTRAGSWERT
    // =====================================================

    const updateErtragswert = (data) => {

        setFormData((prev) => ({

            ...prev,

            ertragswert: {

                ...prev.ertragswert,

                ...data,

                anlagengroesse:
                    data.anlagengroesse ||
                    prev.ertragswert.anlagengroesse,

                spezifischerertrag:
                    data.spezifischer_ertrag ??
                    data.spezifischerertrag ??
                    prev.ertragswert.spezifischerertrag,

                performance_ratio:
                    data.performance_ratio ||
                    prev.ertragswert.performance_ratio,

                degradation:
                    data.degradation_anual ??
                    data.degradation ??
                    prev.ertragswert.degradation,

                opex:
                    data.opex ||
                    prev.ertragswert.opex,

                strompreis:
                    data.strompreis !== undefined
                        ? parseFloat(data.strompreis)
                        : prev.ertragswert.strompreis

            }

        }));

    };


    // =====================================================
    // UPDATE RESTWERT
    // =====================================================

    const updateRestwert = (data) => {

        setFormData((prev) => ({

            ...prev,

            restwert: {

                ...prev.restwert,

                zukuenftige_gewinne:
                    Number(data.zukuenftige_gewinne) || 0,

                restwert:
                    Number(data.restwert) || 0,

                kostenabschlag:
                    Number(data.kostenabschlag) ??
                    prev.restwert.kostenabschlag,

                verkaufsabschlag:
                    Number(data.verkaufsabschlag) ??
                    prev.restwert.verkaufsabschlag,

                wartung:
                    data.wartung ??
                    prev.restwert.wartung,

                zustand:
                    data.zustand ??
                    prev.restwert.zustand,

                pr:
                    Number(data.pr) ||
                    prev.restwert.pr,

                restlaufzeit:
                    Number(data.restlaufzeit) ||
                    prev.restwert.restlaufzeit,

                marktfaktor:
                    Number(data.marktfaktor) ||
                    prev.restwert.marktfaktor

            }

        }));

    };


    // =====================================================
    // UPDATE FINANZIELLE BEWERTUNG
    // =====================================================

    const updateFinanzielleBewertung = (data) => {

        setFormData((prev) => ({

            ...prev,

            finanzielleBewertung: {

                ...prev.finanzielleBewertung,

                ...data

            }

        }));

    };


    // =====================================================
    // PRINT
    // =====================================================

    const handlePrint = () => {

        window.print();

    };


    // =====================================================
    // CURRENT PATH
    // =====================================================

    const pathname =
        window.location.pathname;


    // =====================================================
    // STRIPE RETURN PAGES
    // =====================================================

    if (pathname === "/payment-success") {

        return <PaymentSuccess />;

    }


    if (pathname === "/payment-cancel") {

        return <PaymentCancel />;

    }


    // =====================================================
    // PASSWORD RESET
    // =====================================================

    if (
        pathname ===
        "/passwort-zuruecksetzen"
    ) {

        return (

            <PasswortZurücksetzen

                onCancel={() => {

                    window.history.pushState(
                        {},
                        "",
                        "/"
                    );

                    window.location.reload();

                }}

                onPasswordUpdated={() => {

                    window.history.pushState(
                        {},
                        "",
                        "/"
                    );

                    window.location.reload();

                }}

            />

        );

    }


    // =====================================================
    // AUTHENTICATION LOADING
    // =====================================================

    if (loading) {

        return (

            <div
                className="container mt-5 text-center"
            >

                <div
                    className="spinner-border text-primary"
                >
                </div>

                <p className="mt-3">
                    Lade Anwendung...
                </p>

            </div>

        );

    }


    // =====================================================
    // USER NOT LOGGED IN
    // =====================================================

    if (!user) {

        return (

            <LoginRegister

                onForgotPassword={() => {

                    window.history.pushState(
                        {},
                        "",
                        "/passwort-zuruecksetzen"
                    );

                    window.location.reload();

                }}

            />

        );

    }


    // =====================================================
    // AUTHENTICATED APPLICATION
    // =====================================================

    return (

        <FinancialProvider>

            <Routes>

                {/* =========================================
                    REPORTS
                ========================================= */}

                <Route
                    path="/reports"
                    element={
                        <MeineReports />
                    }
                />


                {/* =========================================
                    PROFILE
                ========================================= */}

                <Route
                    path="/profil"
                    element={
                        <MeinProfil />
                    }
                />


                {/* =========================================
                    CREDITS
                ========================================= */}

                <Route
                    path="/credits"
                    element={
                        <Credits />
                    }
                />


                {/* =========================================
                    HOME
                ========================================= */}

                <Route
                    path="/"
                    element={
                        <Home />
                    }
                />


                {/* =========================================
                    ANALYSE
                ========================================= */}

                <Route
                    path="/analyse"
                    element={

                        <>

                            {/* =================================
                                HEADER
                            ================================= */}

                            <div
                                className="container mt-3 no-print"
                            >

                                <div
                                    className="row align-items-center"
                                >

                                    {/* IZQUIERDA */}

                                    <div
                                        className="col-4 text-start"
                                    >

                                        <a
                                            href="https://www.pv-valuator.de/"
                                            className="btn btn-primary text-white"
                                        >

                                            <i className="bi bi-arrow-left me-2 text-white"></i>

                                            Startseite

                                        </a>

                                    </div>


                                    {/* CENTRO */}

                                    <div
                                        className="col-4 text-center"
                                    >

                                        <button
                                            className="btn btn-primary"
                                            onClick={handlePrint}
                                        >
                                            PDF speichern
                                        </button>

                                    </div>


                                    {/* DERECHA */}

                                    <div
                                        className="col-4 d-flex justify-content-end"
                                    >

                                        <UserMenu />

                                    </div>

                                </div>

                            </div>


                            {/* =================================
                                PV REPORT
                            ================================= */}

                            <div
                                id="pv-report"
                                className="container mt-4"
                            >

                                <h2
                                    className="display-6 mb-4 text-primary text-center fw-bold"
                                >

                                    PV-Valuator

                                    <span
                                        className="badge bg-info ms-2"
                                    >
                                        PRO
                                    </span>

                                </h2>


                                <p
                                    className="mb-4 text-muted fst-italic text-center fs-5"
                                >

                                    Schnelle und transparente Bewertung
                                    von Photovoltaikanlagen inklusive
                                    professionellem PDF-Bericht

                                </p>


                                <div
                                    className="row g-3 align-items-start"
                                >


                                    {/* =================================
                                        LEFT COLUMN
                                    ================================= */}

                                    <div
                                        className="col-lg-6 d-flex flex-column gap-3"
                                    >


                                        {/* ANLAGENDATEN */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <AnlagenDaten

                                                    onDataChange={
                                                        updateAnlagenData
                                                    }

                                                    betriebsmodell={
                                                        formData.betriebsmodell
                                                    }

                                                    anlagenData={
                                                        formData.anlagen
                                                    }

                                                />

                                            </div>

                                        </div>


                                        {/* BETRIEBSMODELL */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <BetriebsmodellSelector

                                                    value={
                                                        formData.betriebsmodell
                                                    }

                                                    onChange={
                                                        updateBetriebsmodell
                                                    }

                                                />

                                            </div>

                                        </div>


                                        {/* BUCHWERT */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <Buchwert

                                                    BASE_URL={
                                                        BASE_URL
                                                    }

                                                    anlagenData={
                                                        formData.anlagen
                                                    }

                                                    onResult={
                                                        updateBuchwert
                                                    }

                                                />

                                            </div>

                                        </div>


                                        {/* ERTRAGSWERT */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <Ertragswert

                                                    BASE_URL={
                                                        BASE_URL
                                                    }

                                                    betriebsmodell={
                                                        formData.betriebsmodell
                                                    }

                                                    pvgisProduction={
                                                        formData.pvgis
                                                    }

                                                    anlagengroesse={
                                                        formData.pvgis?.anlagengroesse ||
                                                        formData.anlagen?.leistung ||
                                                        ""
                                                    }

                                                    restlaufzeit={
                                                        formData.ertragswert.restlaufzeit
                                                    }

                                                    ertragswertData={
                                                        formData.ertragswert
                                                    }

                                                    onResult={(data) => {

                                                        updateErtragswert(
                                                            data
                                                        );

                                                        setErtragsResult(
                                                            data
                                                        );

                                                    }}

                                                />

                                            </div>

                                        </div>


                                        {/* PVGIS */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <PVGISForm

                                                    BASE_URL={
                                                        BASE_URL
                                                    }

                                                    pvgisData={
                                                        formData.pvgis
                                                    }

                                                    onChange={
                                                        updatePVGIS
                                                    }

                                                />

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================
                                        RIGHT COLUMN
                                    ================================= */}

                                    <div
                                        className="col-lg-6 d-flex flex-column gap-3"
                                    >


                                        {/* FINANZIELLE BEWERTUNG */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <FinanzielleBewertung

                                                    ertragswertData={
                                                        formData.ertragswert
                                                    }

                                                    buchwertData={
                                                        formData.buchwert
                                                    }

                                                    onResult={
                                                        updateFinanzielleBewertung
                                                    }

                                                />


                                                {
                                                    formData
                                                        .finanzielleBewertung
                                                        ?.npv && (

                                                        <Dashboard

                                                            data={
                                                                formData.finanzielleBewertung
                                                            }

                                                        />

                                                    )
                                                }

                                            </div>

                                        </div>


                                        {/* RESTWERT */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <Restwert

                                                    BASE_URL={
                                                        BASE_URL
                                                    }

                                                    buchwertData={
                                                        formData.buchwert
                                                    }

                                                    ertragswert={
                                                        ertragsResult
                                                            ?.ertragswertKumuliert
                                                    }

                                                    performanceRatio={
                                                        ertragsResult
                                                            ?.performance_ratio
                                                    }

                                                    restlaufzeit={
                                                        formData
                                                            .ertragswert
                                                            ?.restlaufzeit
                                                    }

                                                    anlagenData={
                                                        formData.anlagen
                                                    }

                                                    zustandAnlage={
                                                        formData
                                                            .anlagen
                                                            ?.zustand
                                                    }

                                                    onResult={
                                                        updateRestwert
                                                    }

                                                />

                                            </div>

                                        </div>


                                        {/* REPORT FORM */}

                                        <div
                                            className="card rounded-4 shadow-sm bg-white border-light"
                                        >

                                            <div className="card-body">

                                                <ReportForm

                                                    BASE_URL={
                                                        BASE_URL
                                                    }

                                                    buchwertData={
                                                        formData.buchwert
                                                    }

                                                    ertragswertData={{

                                                        ...formData.ertragswert,

                                                        betriebsmodell:
                                                            formData.betriebsmodell,

                                                        payback:
                                                            formData
                                                                .finanzielleBewertung
                                                                ?.payback

                                                    }}

                                                    restwertData={
                                                        formData.restwert
                                                    }

                                                    anlagenData={
                                                        formData.anlagen
                                                    }

                                                    pvgisData={
                                                        formData.pvgis
                                                    }

                                                    finanzData={
                                                        formData.finanzielleBewertung
                                                    }

                                                />

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </>

                    }
                />

            </Routes>


            {/* =============================================
                FOOTER
            ============================================= */}

            <footer
                className="mt-5 py-3 border-top bg-light"
            >

                <div className="container">

                    <div
                        className="d-flex justify-content-center align-items-center gap-3"
                    >

                        <img
                            src="/logo-apps4green.png"
                            alt="Apps For Green"
                            style={{
                                height: "30px"
                            }}
                        />

                        <span
                            className="text-muted small"
                        >
                            © 2026 Apps For Green
                        </span>

                        <span
                            className="text-muted"
                        >
                            ·
                        </span>

                        <a
                            href="https://www.apps4green.com"
                            className="text-decoration-none small"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            www.apps4green.com
                        </a>

                    </div>

                </div>

            </footer>

        </FinancialProvider>

    );

}


export default App;