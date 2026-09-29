// Ertragswert.jsx – INTL Version
// German / EEG-specific sections are retained as comments for future German version compatibility.

import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { FinancialContext } from "./FinancialContext.jsx";

function Ertragswert({
  onResult,
  betriebsmodell,
  pvgisProduction,
  anlagengroesse,
  restlaufzeit
}) {
  const kwp = anlagengroesse || "10";

  const [spezErtrag, setSpezErtrag] = useState("1000");

  // ============================================================
  // GERMAN / EEG VERSION - RETAINED FOR FUTURE USE
  // ============================================================
  /*
  const [verguetung, setVerguetung] = useState("8,50");
  const [autoVerguetung, setAutoVerguetung] = useState(null);
  const [eegPeriod, setEegPeriod] = useState("Feb-Jul 2026");
  */

  // INTERNATIONAL VERSION
  // Grid export price in USD/kWh
  const [gridExportPrice, setGridExportPrice] = useState("0.08");

  const [restlaufzeitState, setRestlaufzeitState] = useState(
    restlaufzeit || ""
  );

  const [pr, setPr] = useState("80");
  const [degradation, setDegradation] = useState("0.5");

  const { opex, setOpex } = useContext(FinancialContext);

  // Electricity value / retail electricity price in USD/kWh
  const [strompreis, setStrompreis] = useState("0.30");

  const [eigenverbrauchAnteil, setEigenverbrauchAnteil] = useState("30");

  // Battery energy losses (% of total PV production).
  // Used only for the BESS operating model.
  const [batterieVerluste, setBatterieVerluste] = useState("0");

  // ============================================================
  // GERMAN / MIETERSTROM VERSION - RETAINED FOR FUTURE USE
  // ============================================================
  /*
  const [mieterstromAnteil, setMieterstromAnteil] = useState("40");
  const [mieterstromZuschlag, setMieterstromZuschlag] = useState("0,01");
  */

  const [jahresertragBrutto, setJahresertragBrutto] = useState(null);
  const [ertragswertKumuliert, setErtragswertKumuliert] = useState(null);
  const [ertragswertProJahr, setErtragswertProJahr] = useState(null);
  const [npvState, setNpvState] = useState(null);

  // ============================================================
  // INTERNATIONAL NUMBER PARSER
  // ============================================================
  const parseInternationalFloat = (val) => {
    if (typeof val === "number") return val;

    return parseFloat(String(val).trim());
  };

  // ============================================================
  // INTERNATIONAL NUMBER FORMAT
  // ============================================================
  const formatUS = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }

    return parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercent = (value) => {
    const num = parseInternationalFloat(value);

    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ============================================================
  // GERMAN / EEG DIRECT MARKETING LOGIC
  // RETAINED FOR FUTURE GERMAN VERSION
  // ============================================================
  /*
  const isDirektvermarktung =
    parseInternationalFloat(kwp) > 100 &&
    (
      betriebsmodell === "volleinspeisung" ||
      betriebsmodell === "eigenverbrauch" ||
      betriebsmodell === "eigenverbrauch_batterie"
    );

  const tarifsData = useMemo(() => {
    const size = parseInternationalFloat(kwp) || 0;
    const evAnteil = parseInternationalFloat(eigenverbrauchAnteil) || 0;

    const isAutoconsumo =
      betriebsmodell?.toLowerCase().includes("eigenverbrauch");

    const isVolleinspeisung =
      (evAnteil === 0 || betriebsmodell === "volleinspeisung");

    const getTarifSet = (
      v10,
      vOther,
      e10,
      e40,
      eOther,
      m10,
      m40,
      m100,
      mOther
    ) => ({
      volleinspeisung: size <= 10 ? v10 : vOther,

      eigenverbrauch: isVolleinspeisung
        ? (size <= 10 ? v10 : vOther)
        : (
            size <= 10
              ? e10
              : size <= 40
                ? e40
                : eOther
          ),

      mieterstrom:
        size <= 10
          ? m10
          : size <= 40
            ? m40
            : size <= 100
              ? m100
              : mOther
    });

    return {
      h1: getTarifSet(
        12.34,
        10.35,
        7.78,
        6.73,
        5.50,
        2.56,
        2.38,
        1.60,
        1.60
      ),

      h2: getTarifSet(
        12.22,
        10.25,
        7.70,
        6.66,
        5.45,
        2.51,
        2.35,
        1.58,
        1.58
      ),

      h3: getTarifSet(
        12.09,
        10.14,
        7.63,
        6.60,
        5.39,
        2.49,
        2.33,
        1.65,
        1.56
      ),

      isVolleinspeisung,
      size
    };
  }, [kwp, eigenverbrauchAnteil, betriebsmodell]);

  useEffect(() => {
    // Fecha fija utilizada solo para pruebas
    // const now = new Date("2026-03-16");

    // Fecha actual del ordenador/navegador
    const now = new Date();

    let period = "h1";
    let periodName = "Feb-Jul 2026";

    if (now >= new Date("2027-02-01")) {
      period = "h3";
      periodName = "2027+";
    } else if (now >= new Date("2026-08-01")) {
      period = "h2";
      periodName = "Aug 2026-Jan 2027";
    }

    setEegPeriod(periodName);

    const direktVerkauf = () => {
      const { size, isVolleinspeisung } = tarifsData;

      const values = {
        h1: {
          voll10: 12.74,
          voll100: 10.75,
          voll400: 8.94,
          voll1000: 7.70,

          teil10: 8.18,
          teil40: 7.13,
          teilOther: 5.90
        },

        h2: {
          voll10: 12.61,
          voll100: 10.64,
          voll400: 8.85,
          voll1000: 7.62,

          teil10: 8.10,
          teil40: 7.06,
          teilOther: 5.84
        },

        h3: {
          voll10: 12.48,
          voll100: 10.53,
          voll400: 8.76,
          voll1000: 7.54,

          teil10: 8.02,
          teil40: 6.99,
          teilOther: 5.78
        }
      };

      const tarif = values[period];

      if (isVolleinspeisung) {
        if (size <= 10) return tarif.voll10;
        if (size <= 100) return tarif.voll100;
        if (size <= 400) return tarif.voll400;
        if (size <= 1000) return tarif.voll1000;

        return null;
      }

      if (size <= 10) return tarif.teil10;
      if (size <= 40) return tarif.teil40;

      return tarif.teilOther;
    };

    let modelKey = betriebsmodell;

    if (betriebsmodell?.toLowerCase().includes("eigenverbrauch")) {
      modelKey = "eigenverbrauch";
    }

    const autoValue =
      betriebsmodell === "direktvermarktung"
        ? direktVerkauf()
        : (tarifsData[period][modelKey] || 8.50);

    if (autoValue !== null) {
      setAutoVerguetung(autoValue);
      setVerguetung(autoValue.toFixed(2).replace(".", ","));
    } else {
      setAutoVerguetung(null);
      setVerguetung("0");
    }
  }, [betriebsmodell, tarifsData]);
  */

  // ============================================================
  // SYNCHRONIZE REMAINING LIFETIME
  // ============================================================
  useEffect(() => {
    if (restlaufzeit !== undefined) {
      setRestlaufzeitState(String(restlaufzeit));
    }
  }, [restlaufzeit]);

  useEffect(() => {
    const pvgisSpecificYield =
      pvgisProduction?.spezifischerErtrag ??
      pvgisProduction?.spezifischer_ertrag;

    if (
      pvgisSpecificYield !== null &&
      pvgisSpecificYield !== undefined &&
      !isNaN(parseFloat(pvgisSpecificYield))
    ) {
      setSpezErtrag(String(pvgisSpecificYield));
      return;
    }

    const production = parseFloat(
      pvgisProduction?.production ??
      pvgisProduction?.annual_production
    );

    const size = parseFloat(kwp);

    if (
      !isNaN(production) &&
      !isNaN(size) &&
      size > 0
    ) {
      setSpezErtrag((production / size).toFixed(2));
    }
  }, [pvgisProduction, kwp]);

  // ============================================================
  // CALCULATE PV ECONOMIC VALUE
  // ============================================================
  const calculateErtragswert = async () => {
    const k = parseInternationalFloat(kwp);
    const seInput = parseInternationalFloat(spezErtrag);
    const exportPrice = parseInternationalFloat(gridExportPrice);
    const rl = parseInternationalFloat(restlaufzeitState);
    const prVal = parseInternationalFloat(pr);
    const degr = parseInternationalFloat(degradation);
    const opexVal = parseInternationalFloat(opex);
    const strompreisValue = parseInternationalFloat(strompreis);

    if (
      [
        k,
        seInput,
        exportPrice,
        rl,
        prVal,
        degr,
        opexVal,
        strompreisValue
      ].some(isNaN)
    ) {
      alert("Please enter valid numbers!");
      return;
    }

    // ==========================================================
    // ENERGY FLOW / SELF-CONSUMPTION / BATTERY LOSSES
    // ==========================================================
    const rawEvAnteil =
      parseInternationalFloat(eigenverbrauchAnteil);

    let ea =
      rawEvAnteil > 1
        ? rawEvAnteil / 100
        : rawEvAnteil;

    if (betriebsmodell === "volleinspeisung") {
      ea = 0;
    }

    const rawBatteryLosses =
      parseInternationalFloat(batterieVerluste);

    let batteryLosses =
      betriebsmodell === "eigenverbrauch_batterie"
        ? (rawBatteryLosses > 1
            ? rawBatteryLosses / 100
            : rawBatteryLosses)
        : 0;

    if (isNaN(batteryLosses)) {
      batteryLosses = 0;
    }

    ea = Math.max(0, Math.min(ea, 1));
    batteryLosses = Math.max(0, Math.min(batteryLosses, 1));

    const gridExportShare =
      Math.max(0, 1 - ea - batteryLosses);

    if (ea + batteryLosses > 1) {
      alert("Self-consumption plus battery losses cannot exceed 100%.");
      return;
    }

    // ==========================================================
    // PV PRODUCTION
    // ==========================================================
    const pvProduction =
      pvgisProduction?.production ??
      pvgisProduction?.annual_production ??
      (k * seInput);

    const se =
      pvProduction && k > 0
        ? pvProduction / k
        : seInput;

    // ==========================================================
    // ANNUAL GROSS REVENUE
    //
    // Self-consumed electricity:
    //   self-consumption × retail electricity value
    //
    // Exported electricity:
    //   exported electricity × grid export price
    // ==========================================================
    const jahresBrutto =
      k *
      se *
      (prVal / 100) *
      (
        ea * strompreisValue +
        gridExportShare * exportPrice
      );

    // ==========================================================
    // CUMULATIVE ECONOMIC VALUE + NPV
    // ==========================================================
    let ertragsKumuliert = 0;
    let npv = 0;

    // Keep current 5% discount rate for compatibility.
    // A user-configurable WACC/discount rate can be introduced
    // later as part of the financial evaluation step.
    const discountRate = 0.05;

    let currentJahrProd = jahresBrutto;

    for (let i = 1; i <= rl; i++) {
      const netCashflow =
        currentJahrProd - opexVal;

      ertragsKumuliert += netCashflow;

      npv +=
        netCashflow /
        Math.pow(1 + discountRate, i);

      currentJahrProd *=
        (1 - degr / 100);
    }

    // ==========================================================
    // RESULT OBJECT
    // Internal property names are retained for compatibility.
    // ==========================================================
    const res = {
      anlagengroesse: k,

      spezifischer_ertrag: seInput,

      jahresertrag: pvProduction,

      // Retain the existing internal property name.
      // In INTL this now represents the Grid Export Price
      // in USD/kWh.
      einspeiseverguetung: exportPrice,

      restlaufzeit: rl,

      performance_ratio: prVal,

      degradacion_anual: degr,

      opex_anual: opexVal,

      jahresertragBrutto:
        jahresBrutto.toFixed(2),

      ertragswertKumuliert:
        ertragsKumuliert.toFixed(2),

      ertragswertProJahr:
        rl > 0
          ? (ertragsKumuliert / rl).toFixed(2)
          : "0.00",

      npv:
        npv.toFixed(2),

      betriebsmodell,

      strompreis:
        strompreisValue,

      eigenverbrauch_anteil:
        ea,

      batterie_verluste:
        batteryLosses,

      netzeinspeisung_anteil:
        gridExportShare

      /*
      GERMAN / EEG FIELD - RETAINED FOR FUTURE USE

      eeg_period: eegPeriod,
      */
    };

    // ==========================================================
    // UPDATE LOCAL STATE
    // ==========================================================
    setJahresertragBrutto(
      res.jahresertragBrutto
    );

    setErtragswertKumuliert(
      res.ertragswertKumuliert
    );

    setErtragswertProJahr(
      res.ertragswertProJahr
    );

    setNpvState(
      res.npv
    );

    // ==========================================================
    // RETURN RESULT TO PARENT
    // ==========================================================
    if (onResult) {
      onResult(res);
    }

    // ==========================================================
    // BACKEND
    // ==========================================================
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ertragswert`,
        res
      );
    } catch (error) {
      console.error(
        "Error Ertragswert:",
        error
      );
    }
  };

  return (
    <div className="card mb-4 p-3">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <h4 className="text-primary fw-bold">
        4. PV Economic Value
      </h4>

      {/* ======================================================
          PRODUCTION
      ====================================================== */}

      <div className="row">

        <div className="col-md-6 mb-2">

          <label>
            System Size (kWp):
          </label>

          <input
            type="text"
            className="form-control"
            value={kwp}
            readOnly
            placeholder="10"
          />

          <div className="form-text">
            Automatically transferred from System Information
          </div>

        </div>

        <div className="col-md-6 mb-2">

          <label>
            Specific Yield (kWh/kWp/year):
            If unknown, estimate using PVGIS below
          </label>

          <input
            type="text"
            className="form-control"
            value={spezErtrag}
            onChange={(e) =>
              setSpezErtrag(e.target.value)
            }
            placeholder="1000"
          />

          {pvgisProduction?.production != null && (
            <small className="text-primary">

              PVGIS:{" "}
              {formatUS(
                pvgisProduction.production
              )}{" "}
              kWh/year
              {" • "}
              approx.{" "}
              {formatUS(
                pvgisProduction.production /
                (parseInternationalFloat(kwp) || 1)
              )}{" "}
              kWh/kWp/year

            </small>
          )}

        </div>

      </div>

      {/* ======================================================
          REVENUE ASSUMPTIONS
      ====================================================== */}

      <div className="row mt-2">

        <div className="col-md-4 mb-2">

          <label>
            Electricity Value / Retail Electricity Price (USD/kWh):
          </label>

          <input
            type="text"
            className="form-control"
            value={strompreis}
            onChange={(e) =>
              setStrompreis(e.target.value)
            }
            disabled={
              betriebsmodell === "volleinspeisung"
            }
          />

          <small className="text-muted">
            Value of electricity used on-site
          </small>

        </div>

        <div className="col-md-4 mb-2">

          <label>
            Grid Export Price (USD/kWh):
          </label>

          <input
            type="text"
            className="form-control"
            value={gridExportPrice}
            onChange={(e) =>
              setGridExportPrice(e.target.value)
            }
          />

          <small className="text-muted">
            Value received for electricity exported to the grid
          </small>

        </div>

        <div className="col-md-4 mb-2">

          <label>
            Self-consumption (%):
          </label>

          <input
            type="text"
            className="form-control"
            value={
              betriebsmodell === "volleinspeisung"
                ? "0"
                : eigenverbrauchAnteil
            }
            onChange={(e) =>
              setEigenverbrauchAnteil(e.target.value)
            }
            disabled={
              betriebsmodell === "volleinspeisung"
            }
          />

          <small className="text-muted">
            {betriebsmodell === "volleinspeisung"
              ? "Full Grid Export: self-consumption is automatically set to 0%."
              : "Share of PV electricity used on-site"}
          </small>

        </div>

      </div>

      {betriebsmodell === "eigenverbrauch_batterie" && (
        <div className="row mt-2">
          <div className="col-md-4 mb-2">
            <label>Battery Losses (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-control"
              value={batterieVerluste}
              onChange={(e) => setBatterieVerluste(e.target.value)}
              placeholder="e.g. 10"
            />
            <small className="text-muted">
              Estimated share of total PV production lost through battery operation.
            </small>
          </div>
          <div className="col-md-8 mb-2 d-flex align-items-end">
            <div className="form-text pb-2">
              <strong>Energy flow:</strong>{" "}
              Self-consumption {formatPercent(eigenverbrauchAnteil)}% +{" "}
              Battery losses {formatPercent(batterieVerluste)}% +{" "}
              Grid export {formatPercent(Math.max(0, 100 - parseInternationalFloat(eigenverbrauchAnteil) - parseInternationalFloat(batterieVerluste)))}% = 100%
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          GERMAN / MIETERSTROM INPUTS
          RETAINED AS COMMENTED CODE
      ====================================================== */}

      {/*
      {betriebsmodell === "mieterstrom" && (
        <>
          <div className="col-md-4 mb-2">
            <label>Mieterstrom-Anteil (%):</label>

            <input
              type="text"
              className="form-control"
              value={mieterstromAnteil}
              onChange={(e) =>
                setMieterstromAnteil(e.target.value)
              }
            />
          </div>

          <div className="col-md-4 mb-2">
            <label>Mieterstrom-Zuschlag (€/kWh):</label>

            <input
              type="text"
              className="form-control"
              value={mieterstromZuschlag}
              onChange={(e) =>
                setMieterstromZuschlag(e.target.value)
              }
            />
          </div>
        </>
      )}
      */}

      {/* ======================================================
          OPERATING MODEL
      ====================================================== */}

      <div className="alert alert-success mb-3">

        <div className="row align-items-center">

          <div className="col-md-6">

            <strong>
              📊 Operating Model:
            </strong>

            <br />

            <span className="badge bg-success fs-6 mt-1">

            {betriebsmodell === "volleinspeisung"
              ? "Full Grid Export"
              : betriebsmodell === "eigenverbrauch"
              ? "Self-consumption + Grid Export"
              : betriebsmodell === "eigenverbrauch_batterie"
              ? "Self-consumption + Battery (BESS)"
              : "NOT SELECTED"}

          </span>

          </div>

          <div className="col-md-6">

            <strong>
              ⚡ Grid Export Price:
            </strong>

            <br />

            <span className="badge bg-warning fs-6 mt-1">

              ${formatUS(gridExportPrice)}
              {" / kWh"}

            </span>

          </div>

        </div>

      </div>

      {/* ======================================================
          GERMAN / EEG DISPLAY
          RETAINED AS COMMENTED CODE
      ====================================================== */}

      {/*
      <div className="alert alert-success mb-3">

        <div className="row align-items-center">

          <div className="col-md-4">
            <strong>📊 Modell:</strong>
            <br />

            <span className="badge bg-success fs-6 mt-1">
              {betriebsmodell.toUpperCase()}
            </span>
          </div>

          <div className="col-md-4">

            {isDirektvermarktung ? (
              <>
                <strong>⚡ Vergütung:</strong>
                <br />

                <span className="badge bg-info fs-6 mt-1">
                  Direktvermarktung
                </span>
              </>
            ) : (
              <>
                <strong>⚡ AUTO-Vergütung:</strong>
                <br />

                <span className="badge bg-warning fs-6 mt-1">
                  {formatEuro(autoVerguetung)} ct/kWh
                </span>
              </>
            )}

          </div>

          <div className="col-md-4">

            <strong>📅 EEG-Periode:</strong>
            <br />

            <span className="badge bg-primary fs-6 mt-1">
              {eegPeriod}
            </span>

          </div>

        </div>

      </div>
      */}

      {/* ======================================================
          REMAINING LIFETIME
      ====================================================== */}

      <div className="row">

        <div className="col-md-6 mb-2">

          <label>
            Remaining Lifetime (years):
          </label>

          <input
            type="text"
            className="form-control"
            value={restlaufzeitState}
            onChange={(e) =>
              setRestlaufzeitState(e.target.value)
            }
          />

          <small className="text-muted">
            Expected asset lifetime minus current asset age
          </small>

        </div>

      </div>

      {/* ======================================================
          TECHNICAL / OPERATING ASSUMPTIONS
      ====================================================== */}

      <div className="row mt-2">

        <div className="col-md-4 mb-2">

          <label>
            Performance Ratio (PR %):
          </label>

          <input
            type="number"
            className="form-control"
            value={pr}
            onChange={(e) =>
              setPr(e.target.value)
            }
          />

          <small className="text-muted">
            Typical range: 75–85%
          </small>

        </div>

        <div className="col-md-4 mb-2">

          <label>
            Annual Degradation (% / year):
          </label>

          <input
            type="text"
            className="form-control"
            value={degradation}
            onChange={(e) =>
              setDegradation(e.target.value)
            }
          />

          <small className="text-muted">
            Typical range: 0.3–0.8%
          </small>

        </div>

        <div className="col-md-4 mb-2">

          <label>
            Annual Operating Costs (OPEX) (USD):
          </label>

          <input
            type="text"
            className="form-control"
            value={opex}
            onChange={(e) =>
              setOpex(e.target.value)
            }
          />

          <small className="text-muted">
            Annual operating, maintenance, monitoring,
            insurance and administration costs
          </small>

        </div>

      </div>

      {/* ======================================================
          CALCULATE BUTTON
      ====================================================== */}

      <button
        className="btn btn-primary btn-lg w-100 mt-3"
        onClick={calculateErtragswert}
      >
        💰 Calculate PV Economic Value
      </button>

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {jahresertragBrutto !== null && (

        <div className="alert alert-success mt-4">

          <h5 className="mb-3 fs-5 fw-bold">
            Result
          </h5>

          <div className="row text-center">

            <div className="col-md-3 mb-2">

              <div className="text-muted fs-6 fw-bold">
                📈 Annual Gross Revenue
              </div>

              <div className="fs-5 fw-bold text-success">

                ${formatUS(jahresertragBrutto)}

              </div>

            </div>

            <div className="col-md-3 mb-2">

              <div className="text-muted fs-6 fw-bold">
                📊 Average Annual Net Economic Value
              </div>

              <div className="fs-5 fw-bold text-success">

                ${formatUS(ertragswertProJahr)}

              </div>

            </div>

            <div className="col-md-3 mb-2">

              <div className="text-muted fs-6 fw-bold">
                💰 Cumulative PV Economic Value
              </div>

              <div className="fs-5 fw-bold text-success">

                ${formatUS(ertragswertKumuliert)}

              </div>

            </div>

            <div className="col-md-3 mb-2">

              <div className="text-muted fs-6 fw-bold">
                📉 NPV
              </div>

              <div className="fs-5 fw-bold text-success">

                ${formatUS(npvState)}

              </div>

            </div>

          </div>

          <hr />

          <p className="mb-0 text-center text-muted fs-6">

            ✅{" "}
            <strong>
              Calculated with:
            </strong>{" "}

            {
            betriebsmodell === "volleinspeisung"
              ? "Full Grid Export"
              : betriebsmodell === "eigenverbrauch"
              ? "Self-consumption + Grid Export"
              : betriebsmodell === "eigenverbrauch_batterie"
              ? "Self-consumption + Battery (BESS)"
              : betriebsmodell
          } • PR {formatPercent(pr)}% • Degradation {formatPercent(degradation)}% • OPEX ${formatUS(opex)}

          </p>

        </div>

      )}

    </div>
  );
}

export default Ertragswert;