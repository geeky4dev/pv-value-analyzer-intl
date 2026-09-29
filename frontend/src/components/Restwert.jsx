import React, { useEffect, useState } from "react";

/*
  ============================================================
  7. RESIDUAL VALUE
  International version of Restwert.jsx

  IMPORTANT:
  - Internal variable names are intentionally kept in German
    to remain compatible with the existing application/backend.
  - The user interface is in English.
  - Monetary values are displayed in USD.
  - The existing calculation logic is preserved.
  ============================================================
*/

function Restwert({
  ertragswert,
  performanceRatio,
  onResult,
  restlaufzeit,
  zustandAnlage,
}) {
  // ==========================================================
  // INPUT STATES
  // ==========================================================

  const [kostenabschlag, setKostenabschlag] = useState(10);
  const [verkaufsabschlag, setVerkaufsabschlag] = useState(50);

  const [wartungRegelmaessig, setWartungRegelmaessig] = useState(true);

  const [zustand, setZustand] = useState("gut");

  const [pr, setPr] = useState("80");

  /*
    The German version received restlaufzeit as a prop but
    also attempted to modify it directly.

    The international version uses a local state correctly.
    This does NOT change the financial calculation logic.
  */
  const [restlaufzeitState, setRestlaufzeitState] = useState(
    restlaufzeit || ""
  );

  const [marktfaktor, setMarktfaktor] = useState(100);

  // ==========================================================
  // RESULT STATES
  // ==========================================================

  const [zukunft, setZukunft] = useState(null);
  const [restwertCalc, setRestwertCalc] = useState(null);

  // ==========================================================
  // SYNCHRONIZE PERFORMANCE RATIO
  // ==========================================================

  useEffect(() => {
    if (performanceRatio !== undefined && performanceRatio !== null) {
      setPr(String(performanceRatio));
    }
  }, [performanceRatio]);

  // ==========================================================
  // SYNCHRONIZE REMAINING LIFETIME
  // ==========================================================

  useEffect(() => {
    if (restlaufzeit !== undefined && restlaufzeit !== null) {
      setRestlaufzeitState(String(restlaufzeit));
    }
  }, [restlaufzeit]);

  // ==========================================================
  // SYNCHRONIZE SYSTEM CONDITION
  // ==========================================================

  useEffect(() => {
    /*
      IMPORTANT:
      AnlagenDaten still uses the original internal German values.

      Therefore we keep this mapping for compatibility:

      Sehr gut  -> ausgezeichnet
      Gut       -> gut
      Mittel    -> durchschnittlich
      Schlecht  -> schlecht
    */

    const zustandMapping = {
      "Sehr gut": "ausgezeichnet",
      Gut: "gut",
      Mittel: "durchschnittlich",
      Schlecht: "schlecht",
    };

    if (zustandAnlage) {
      setZustand(zustandMapping[zustandAnlage] || "gut");
    }
  }, [zustandAnlage]);

  // ==========================================================
  // NUMBER PARSER
  // ==========================================================

  /*
    International number parser.

    It accepts both:
      12000
      12000.50
      12000,50

    This keeps compatibility with existing input values.
  */
  const parseInternationalFloat = (val) => {
    if (val === null || val === undefined || val === "") {
      return 0;
    }

    const str = String(val).replace(",", ".");

    return parseFloat(str) || 0;
  };

  // ==========================================================
  // USD FORMATTER
  // ==========================================================

  const formatUSD = (valor) => {
    if (valor === null || valor === undefined || valor === "") {
      return "$0.00";
    }

    return Number(valor).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ==========================================================
  // CALCULATE RESIDUAL VALUE
  // ==========================================================

  const calculateRestwert = () => {
    const ew = parseInternationalFloat(ertragswert);

    /*
      German version:
      alert("Bitte zuerst Ertragswert berechnen!");

      International version:
    */
    if (isNaN(ew) || ew === 0) {
      alert("Please calculate the PV Economic Value first.");
      return;
    }

    const prVal = parseInternationalFloat(pr);
    const rlVal = parseInternationalFloat(restlaufzeitState);

    // ========================================================
    // ORIGINAL CALCULATION LOGIC
    // ========================================================

    let zukuenftigeGewinne =
      ew * (1 - kostenabschlag / 100);

    // Regular maintenance adjustment
    if (wartungRegelmaessig) {
      zukuenftigeGewinne *= 1.15;
    }

    // ========================================================
    // SYSTEM CONDITION FACTOR
    // ========================================================

    const zustandMap = {
      ausgezeichnet: 1.1,
      gut: 1.0,
      durchschnittlich: 0.9,
      schlecht: 0.8,
    };

    zukuenftigeGewinne *= zustandMap[zustand];

    // ========================================================
    // PERFORMANCE RATIO ADJUSTMENT
    // ========================================================

    if (prVal > 85) {
      zukuenftigeGewinne *= 1.05;
    } else if (prVal < 75) {
      zukuenftigeGewinne *= 0.9;
    }

    // ========================================================
    // REMAINING LIFETIME ADJUSTMENT
    // ========================================================

    if (rlVal > 15) {
      zukuenftigeGewinne *= 1.1;
    } else if (rlVal < 10) {
      zukuenftigeGewinne *= 0.85;
    }

    // ========================================================
    // MARKET FACTOR
    // ========================================================

    zukuenftigeGewinne *= marktfaktor / 100;

    // ========================================================
    // RESIDUAL VALUE
    // ========================================================

    const restwert =
      zukuenftigeGewinne *
      (verkaufsabschlag / 100);

    // ========================================================
    // SAVE RESULTS
    // ========================================================

    setZukunft(zukuenftigeGewinne.toFixed(2));
    setRestwertCalc(restwert.toFixed(2));

    // ========================================================
    // RESULT LABELS
    // ========================================================

    const zustandLabels = {
      ausgezeichnet: "Excellent (+10%)",
      gut: "Good (0%)",
      durchschnittlich: "Average (-10%)",
      schlecht: "Poor (-20%)",
    };

    // ========================================================
    // SEND RESULT TO PARENT / APP
    // ========================================================

    if (onResult) {
      onResult({
        /*
          Keep the original internal property names.
          Other components, PDF generation and App.jsx
          may depend on them.
        */

        ertragswert: ew.toFixed(2),

        zukuenftige_gewinne:
          zukuenftigeGewinne.toFixed(2),

        restwert: restwert.toFixed(2),

        kostenabschlag,

        verkaufsabschlag,

        wartung: wartungRegelmaessig,

        zustand,

        zustand_label: zustandLabels[zustand],

        pr: prVal,

        restlaufzeit: rlVal,

        marktfaktor,
      });
    }
  };

  // ==========================================================
  // USER INTERFACE
  // ==========================================================

  return (
    <div className="card mb-4 p-3">

      {/* ======================================================
          SECTION TITLE
          ====================================================== */}

      <h4 className="text-primary fw-bold">
        7. Residual Value
      </h4>

      {/* ======================================================
          PV ECONOMIC VALUE
          ====================================================== */}

      <div className="mb-3">
        <label>
          PV Economic Value (USD):
        </label>

        <input
          type="text"
          className="form-control"
          value={formatUSD(ertragswert)}
          readOnly
          style={{ backgroundColor: "#e9ecef" }}
        />
      </div>

      {/* ======================================================
          COST DISCOUNT
          ====================================================== */}

      <div className="mb-3">
        <label>
          <strong>
            Cost Discount (%):
          </strong>

          <span className="float-end fw-bold text-success">
            {kostenabschlag} %
          </span>
        </label>

        <input
          type="range"
          className="form-range"
          min="5"
          max="30"
          value={kostenabschlag}
          onChange={(e) =>
            setKostenabschlag(
              Number(e.target.value)
            )
          }
        />
      </div>

      {/* ======================================================
          SALES DISCOUNT
          ====================================================== */}

      <div className="mb-3">
        <label>
          <strong>
            Sales Discount (%):
          </strong>

          <span className="float-end fw-bold text-success">
            {verkaufsabschlag}%
          </span>
        </label>

        <input
          type="range"
          className="form-range"
          min="30"
          max="80"
          value={verkaufsabschlag}
          onChange={(e) =>
            setVerkaufsabschlag(
              Number(e.target.value)
            )
          }
        />
      </div>

      {/* ======================================================
          REGULAR MAINTENANCE
          ====================================================== */}

      <div className="form-check form-switch mb-3">

        <input
          type="checkbox"
          className="form-check-input"
          checked={wartungRegelmaessig}
          onChange={(e) =>
            setWartungRegelmaessig(
              e.target.checked
            )
          }
        />

        <label className="form-check-label">
          Regular Maintenance{" "}
          <span className="badge bg-success">
            +15%
          </span>
        </label>

      </div>

      {/* ======================================================
          SYSTEM CONDITION
          ====================================================== */}

      <div className="mb-2">

        <label>
          PV System Condition:
        </label>

        <select
          className="form-select"
          value={zustand}
          disabled
        >
          <option value="ausgezeichnet">
            Excellent (+10%)
          </option>

          <option value="gut">
            Good (0%)
          </option>

          <option value="durchschnittlich">
            Average (-10%)
          </option>

          <option value="schlecht">
            Poor (-20%)
          </option>
        </select>

      </div>

      {/* ======================================================
          PERFORMANCE RATIO
          ====================================================== */}

      <div className="mb-2">

        <label>
          Performance Ratio (%):
        </label>

        <input
          type="text"
          className="form-control"
          value={pr}
          readOnly
          disabled
        />

      </div>

      {/* ======================================================
          REMAINING LIFETIME
          ====================================================== */}

      <div className="mb-2">

        <label>
          Remaining Lifetime (years):
        </label>

        <input
          type="text"
          className="form-control"
          value={restlaufzeitState}
          onChange={(e) =>
            setRestlaufzeitState(
              e.target.value
            )
          }
        />

      </div>

      {/* ======================================================
          MARKET FACTOR
          ====================================================== */}

      <div className="mb-2">

        <label>
          Market Factor:
        </label>

        <select
          className="form-select"
          value={marktfaktor}
          onChange={(e) =>
            setMarktfaktor(
              Number(e.target.value)
            )
          }
        >

          <option value="90">
            Weak (90%)
          </option>

          <option value="100">
            Normal (100%)
          </option>

          <option value="110">
            Strong (110%)
          </option>

        </select>

      </div>

      {/* ======================================================
          CALCULATE BUTTON
          ====================================================== */}

      <button
        className="btn btn-primary w-100 mt-3"
        onClick={calculateRestwert}
      >
        💰 Calculate Residual Value
      </button>

      {/* ======================================================
          RESULTS
          ====================================================== */}

      {restwertCalc && (
        <div className="alert alert-success mt-3">

          <h5>
            Result
          </h5>

          <p>
            <strong>
              Future Earnings:
            </strong>{" "}
            {formatUSD(zukunft)}
          </p>

          <p>
            <strong>
              Residual Value:
            </strong>{" "}
            {formatUSD(restwertCalc)}
          </p>

        </div>
      )}

    </div>
  );
}

export default Restwert;


/*
================================================================
GERMAN VERSION – NOT USED IN THE INTERNATIONAL UI
================================================================

The following German-specific UI concepts from the original
version have intentionally NOT been used as visible text:

- "7. Restwert berechnen"
- "Ertragswert (€)"
- "Abschlag für Kosten (%) auswählen"
- "Abschlag für Verkauf (%) auswählen"
- "Regelmäßige Wartung"
- "Zustand der Anlage"
- "Performance Ratio (%)"
- "Restlaufzeit (Jahre)"
- "Marktfaktor"
- "Schwach"
- "Normal"
- "Stark"
- "Restwert berechnen"
- "Ergebnis"
- "Zukünftige Gewinne"
- "Restwert"

The original German-specific labels are replaced by their
international English equivalents above.

IMPORTANT:
The internal German variable/property names have NOT been
removed because the existing App.jsx, backend and PDF/report
logic may still use them.

Examples intentionally retained:

- ertragswert
- zukuenftige_gewinne
- restwert
- kostenabschlag
- verkaufsabschlag
- wartung
- zustand
- zustand_label
- pr
- restlaufzeit
- marktfaktor

The German condition values are also intentionally retained
internally:

- ausgezeichnet
- gut
- durchschnittlich
- schlecht

This allows the international frontend to remain compatible
with the existing application logic while presenting an
English user interface.

================================================================
*/