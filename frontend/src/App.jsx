import React, { useState, useEffect } from "react";

import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";

import Register from "./components/Register";

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

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5001";


function App() {


  const {
      user,
      profile,
      loading
  } = useAuth();

  const {
    credits,
    loadingCredits
  } = useCredits();

  console.log(
    "CREDITS:",
    credits,
    "LOADING:",
    loadingCredits
  );

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


  console.log("AUTH USER:", user);
  console.log("PROFILE:", profile);

  const [showRegister, setShowRegister] = useState(false);

  const [formData, setFormData] = useState({


    anlagen: {
      adresse: "", plz: "", ort: "", bundesland: "",
      name: "", email: "", telefon: "",
      leistung: "", inbetriebnahme: "",
      modultyp: "", modulhersteller: "", modulmodell: "",
      wechselrichtertyp: "", wechselrichterhersteller: "", wechselrichtermodell: "",
      wechselrichterjahr: "", wechselrichteraustausch: false,
      installationsart: "", dachneigung: "", azimut: "",
      pr: "", degradation: "", latitude: "", longitude: "",
      zustand: "", letzteWartung: "", wartungsvertrag: false, bekannteProbleme: ""
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

  const updateAnlagenData = (data) => {
    setFormData((prev) => ({
      ...prev,
      anlagen: { ...prev.anlagen, ...data },
      pvgis: {
        ...prev.pvgis,
        anlagengroesse: data.leistung || prev.pvgis.anlagengroesse
      }
    }));
  };

  const updateBetriebsmodell = (model) => {
    setFormData((prev) => ({
      ...prev,
      betriebsmodell: model || "volleinspeisung"
    }));
  };

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
          spezifischerErtrag: newSpezErtrag,
          production: newProduction
        },

        anlagen: {
          ...prev.anlagen,
          latitude: data.latitude || prev.anlagen.latitude,
          longitude: data.longitude || prev.anlagen.longitude
        },

        ertragswert: {
          ...prev.ertragswert,
          anlagengroesse:
            data.anlagengroesse ||
            prev.ertragswert.anlagengroesse,

          spezifischerertrag: newSpezErtrag,

          performance_ratio: currentPR,

          production: newProduction,

          jahresertrag: newProduction
        }

      };

    });

  };

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

  const updateFinanzielleBewertung = (data) => {

    setFormData((prev) => ({

      ...prev,

      finanzielleBewertung: {
        ...prev.finanzielleBewertung,
        ...data
      }

    }));

  };

  const handlePrint = () => {
    window.print();
  };

  const [ertragsResult, setErtragsResult] = useState(null);


      if (loading) {

      return (

          <div className="container mt-5 text-center">

              <div className="spinner-border text-primary">
              </div>

              <p className="mt-3">
                  Lade Anwendung...
              </p>

          </div>

      );

  }



if (!user) {

    return (

        <>
            {showRegister ? (

                <Register />

            ) : (

                <Login />

            )}

            <div className="text-center mt-3">

                {showRegister ? (

                    <button
                        className="btn btn-link"
                        onClick={() => setShowRegister(false)}
                    >
                        Bereits registriert? Jetzt anmelden
                    </button>

                ) : (

                    <button
                        className="btn btn-link"
                        onClick={() => setShowRegister(true)}
                    >
                        Noch kein Konto? Jetzt registrieren
                    </button>

                )}

            </div>

        </>

    );

}

return (

  <FinancialProvider>

    <Routes>

      <Route 
        path="/reports" 
        element={<MeineReports />} 
      />

      <Route
        path="/profil"
        element={<MeinProfil />}
      />

      <Route
        path="*"
        element={

          <>

            <div className="container mt-3 d-flex justify-content-end">

              <UserMenu />

            </div>


            <div className="container mt-3 no-print text-center">

              <button
                className="btn btn-primary"
                onClick={handlePrint}
              >
                📄 Ansicht als PDF speichern
              </button>

            </div>


            <div
              id="pv-report"
              className="container mt-4"
            >

              <h2 className="display-6 mb-4 text-primary text-center fw-bold">

                PV-Wirtschaftlichkeitsanalyse System

                <span className="badge bg-info ms-2">
                  PRO
                </span>

              </h2>


              <p className="mb-4 text-muted fst-italic text-center fs-5">

                Schnelle und automatisierte Bewertung von Photovoltaik-Investitionen mit professionellem PDF-Bericht

              </p>


              <div className="row g-3 align-items-start">


                <div className="col-lg-6 d-flex flex-column gap-3">


                  <div className="card rounded-4 shadow-sm bg-white border-light">

                    <div className="card-body">

                      <AnlagenDaten

                        onDataChange={updateAnlagenData}

                        betriebsmodell={formData.betriebsmodell}

                        anlagenData={formData.anlagen}

                      />

                    </div>

                  </div>



                  <div className="card rounded-4 shadow-sm bg-white border-light">

                    <div className="card-body">

                      <BetriebsmodellSelector

                        value={formData.betriebsmodell}

                        onChange={updateBetriebsmodell}

                      />

                    </div>

                  </div>



                  <div className="card rounded-4 shadow-sm bg-white border-light">

                    <div className="card-body">

                      <Buchwert

                        BASE_URL={BASE_URL}

                        anlagenData={formData.anlagen}

                        onResult={updateBuchwert}

                      />

                    </div>

                  </div>




                  <div className="card rounded-4 shadow-sm bg-white border-light">

                    <div className="card-body">

                      <Ertragswert

                        BASE_URL={BASE_URL}

                        betriebsmodell={formData.betriebsmodell}

                        pvgisProduction={formData.pvgis}

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


                        onResult={(data)=>{

                          updateErtragswert(data);

                          setErtragsResult(data);

                        }}

                      />

                    </div>

                  </div>




                  <div className="card rounded-4 shadow-sm bg-white border-light">

                    <div className="card-body">

                      <PVGISForm

                        BASE_URL={BASE_URL}

                        pvgisData={formData.pvgis}

                        onChange={updatePVGIS}

                      />

                    </div>

                  </div>



                </div>





                <div className="col-lg-6 d-flex flex-column gap-3">


                  <div className="card rounded-4 shadow-sm bg-white border-light">

                    <div className="card-body">


                      <FinanzielleBewertung

                        ertragswertData={formData.ertragswert}

                        buchwertData={formData.buchwert}

                        onResult={updateFinanzielleBewertung}

                      />



                      {
                        formData.finanzielleBewertung?.npv &&

                        <Dashboard

                          data={
                            formData.finanzielleBewertung
                          }

                        />

                      }



                    </div>

                  </div>






                  <div className="card rounded-4 shadow-sm bg-white border-light">


                    <div className="card-body">


                      <Restwert

                        BASE_URL={BASE_URL}

                        buchwertData={formData.buchwert}

                        ertragswert={
                          ertragsResult?.ertragswertKumuliert
                        }

                        performanceRatio={
                          ertragsResult?.performance_ratio
                        }

                        restlaufzeit={
                          formData.ertragswert?.restlaufzeit
                        }

                        anlagenData={
                          formData.anlagen
                        }

                        zustandAnlage={
                          formData.anlagen?.zustand
                        }

                        onResult={updateRestwert}

                      />


                    </div>


                  </div>






                  <div className="card rounded-4 shadow-sm bg-white border-light">


                    <div className="card-body">


                      <ReportForm

                        BASE_URL={BASE_URL}

                        buchwertData={
                          formData.buchwert
                        }


                        ertragswertData={{

                          ...formData.ertragswert,

                          betriebsmodell:
                          formData.betriebsmodell,


                          payback:
                          formData.finanzielleBewertung?.payback

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


  </FinancialProvider>

);

}

export default App;