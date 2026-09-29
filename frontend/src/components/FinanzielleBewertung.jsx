// FinanzielleBewertung.jsx PRO - International Version
// Financial Analysis & Overview
//
// International version:
// - UI translated to English
// - Currency display changed from EUR to USD
// - German-specific interpretation text commented out
// - Financial calculation logic unchanged
// - Internal variable/property names preserved for compatibility
//   with App.jsx, Ertragswert.jsx, Buchwert.jsx and FinancialContext.jsx

import React, { useState, useContext } from "react";
import { FinancialContext } from "./FinancialContext.jsx";

function FinanzielleBewertung({ ertragswertData, buchwertData, onResult }) {
  const [discountRate, setDiscountRate] = useState("5");
  const [horizon, setHorizon] = useState("20");

  // ------------------------------------------------------------
  // Global OPEX from FinancialContext
  // ------------------------------------------------------------
  const { opex, setOpex } = useContext(FinancialContext);

  const [npv, setNpv] = useState(null);
  const [irr, setIrr] = useState(null);
  const [cashflows, setCashflows] = useState([]);
  const [paybackYear, setPaybackYear] = useState(null);
  const [interpretation, setInterpretation] = useState("");

  // ------------------------------------------------------------
  // Helper for processing numerical inputs
  //
  // The original German version accepted comma or point
  // decimal separators. This behavior is preserved.
  // ------------------------------------------------------------
  const parseInternationalFloat = (val) => {
    if (val === null || val === undefined || val === "") return 0;

    const str = String(val).replace(",", ".");
    return parseFloat(str) || 0;
  };

  // ------------------------------------------------------------
  // Helper for displaying USD values
  // ------------------------------------------------------------
  const formatUSD = (value) => {
    if (value === null || value === undefined) return "$0.00";

    return `$${parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ------------------------------------------------------------
  // Robust IRR calculation
  // Financial logic unchanged
  // ------------------------------------------------------------
  const calculateIRR = (
    flows,
    guess = 0.01,
    tol = 1e-6,
    maxIter = 1000
  ) => {
    if (flows.every((f) => f <= 0) || flows.every((f) => f >= 0)) {
      return "not available";
    }

    let irrGuess = guess;

    for (let i = 0; i < maxIter; i++) {
      let npvTest = 0;
      let deriv = 0;

      for (let t = 0; t < flows.length; t++) {
        npvTest += flows[t] / Math.pow(1 + irrGuess, t);

        deriv +=
          (-t * flows[t]) /
          Math.pow(1 + irrGuess, t + 1);
      }

      const newGuess =
        deriv !== 0
          ? irrGuess - npvTest / deriv
          : irrGuess - npvTest / 1e-6;

      if (!isFinite(newGuess)) {
        return "not available";
      }

      if (Math.abs(newGuess - irrGuess) < tol) {
        return (newGuess * 100).toFixed(2);
      }

      irrGuess = newGuess;
    }

    return (irrGuess * 100).toFixed(2);
  };

  // ------------------------------------------------------------
  // Financial calculation:
  // Cashflows, NPV, IRR and Payback
  //
  // IMPORTANT:
  // The financial calculation logic is intentionally unchanged.
  // ------------------------------------------------------------
  const calculateFinanzen = () => {
    if (!ertragswertData) {
      alert("Please calculate the PV Economic Value first.");
      return;
    }

    // ----------------------------------------------------------
    // Base variables
    // Internal property names are preserved for compatibility.
    // ----------------------------------------------------------
    const initialInvestment = parseInternationalFloat(
      buchwertData?.buchwert ||
        buchwertData?.anschaffung ||
        0
    );

    const horizonVal = parseInternationalFloat(horizon);

    const restlaufzeit = parseInternationalFloat(
      ertragswertData?.restlaufzeit || horizonVal
    );

    const einnahmen_jahr1 = parseInternationalFloat(
      ertragswertData?.jahresertragBrutto || 0
    );

    const degradacion =
      parseInternationalFloat(
        ertragswertData?.degradacion_anual || 0.5
      ) / 100;

    const opexVal = parseInternationalFloat(opex || 0);

    const r =
      parseInternationalFloat(discountRate) / 100;

    const yearsWithFlow = Math.min(
      horizonVal,
      restlaufzeit
    );

    // ----------------------------------------------------------
    // Input validation
    // ----------------------------------------------------------
    if (
      isNaN(initialInvestment) ||
      initialInvestment <= 0
    ) {
      alert(
        "Depreciated Asset Value is missing or zero. Please enter the CAPEX above."
      );
      return;
    }

    if (
      isNaN(einnahmen_jahr1) ||
      einnahmen_jahr1 <= 0
    ) {
      alert(
        "PV Economic Value data is missing. Please calculate Step 4 first."
      );
      return;
    }

    // ----------------------------------------------------------
    // Build cashflows
    // ----------------------------------------------------------
    const flows = [-initialInvestment];

    let cumulative = -initialInvestment;
    let payback = null;
    let currentYearIncome = einnahmen_jahr1;

    for (let t = 1; t <= yearsWithFlow; t++) {
      const annualNetFlow =
        currentYearIncome - opexVal;

      flows.push(annualNetFlow);

      cumulative += annualNetFlow;

      if (
        payback === null &&
        cumulative >= 0
      ) {
        payback = t;
      }

      currentYearIncome *=
        1 - degradacion;
    }

    // ----------------------------------------------------------
    // NPV
    // ----------------------------------------------------------
    const npvCalc = flows.reduce(
      (acc, val, t) =>
        acc +
        val / Math.pow(1 + r, t),
      0
    );

    // ----------------------------------------------------------
    // IRR
    // ----------------------------------------------------------
    const irrPercentRaw =
      calculateIRR(flows);

    // ----------------------------------------------------------
    // International display:
    // No German decimal-comma formatting required.
    // ----------------------------------------------------------
    const irrDisplay = irrPercentRaw;

    // ----------------------------------------------------------
    // International interpretation
    //
    // Original German-specific interpretation retained below
    // as commented code.
    // ----------------------------------------------------------
    let interpretationText =
      npvCalc > 0
        ? "Investment generates a positive NPV at the selected discount rate."
        : "Investment generates a negative or zero NPV at the selected discount rate.";

    /*
    // Original German interpretation:

    let interpretationText =
      npvCalc > 0
        ? "✅ Investition ist wirtschaftlich sinnvoll"
        : "⚠️ Wirtschaftlichkeit eingeschränkt!\n Rentabilität nur bei hohem Eigenverbrauch erreichbar → Elektroauto, Heim-Batterie oder Wärmepumpe. Oder Anschaffungskosten (CAPEX) senken durch günstige Module, effiziente Installation oder Förderungen.";
    */

    // ----------------------------------------------------------
    // Update component state
    // ----------------------------------------------------------
    setNpv(npvCalc.toFixed(2));
    setIrr(irrDisplay);
    setCashflows(flows);
    setPaybackYear(payback);
    setInterpretation(interpretationText);

    // ----------------------------------------------------------
    // Return result to parent
    //
    // Internal property names preserved.
    // ----------------------------------------------------------
    if (onResult) {
      onResult({
        npv: npvCalc.toFixed(2),
        irr: irrPercentRaw,
        discount_rate:
          parseInternationalFloat(discountRate),
        horizon: horizonVal,
        opex: opexVal,
        interpretation: interpretationText,
        cashflows: flows,
        payback: payback,
      });
    }
  };

  // ============================================================
  // USER INTERFACE
  // ============================================================

  return (
    <div className="card mb-4 p-3">

      {/* --------------------------------------------------------
          SECTION HEADER
      -------------------------------------------------------- */}
      <h4 className="text-primary fw-bold">
        6. Financial Analysis & Overview{" "}
        <span className="badge bg-warning">
          PRO
        </span>
      </h4>

      {/* --------------------------------------------------------
          INPUTS
      -------------------------------------------------------- */}
      <div className="row">

        {/* Discount Rate */}
        <div className="col-md-4 mb-2">
          <label>
            Discount Rate (%):
          </label>

          <input
            type="text"
            className="form-control"
            value={discountRate}
            onChange={(e) =>
              setDiscountRate(e.target.value)
            }
          />
        </div>

        {/* Analysis Horizon */}
        <div className="col-md-4 mb-2">
          <label>
            Analysis Horizon (years):
          </label>

          <input
            type="text"
            className="form-control"
            value={horizon}
            onChange={(e) =>
              setHorizon(e.target.value)
            }
          />
        </div>

        {/* Annual OPEX */}
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
        </div>
      </div>

      {/* --------------------------------------------------------
          CALCULATE BUTTON
      -------------------------------------------------------- */}
      <button
        className="btn btn-dark w-100 mt-3"
        onClick={calculateFinanzen}
      >
        📊 Calculate Financial Analysis
      </button>

      {/* --------------------------------------------------------
          RESULTS
      -------------------------------------------------------- */}
      {npv && (
        <div className="mt-4 p-3 border rounded bg-light">

          <div className="row text-center">

            {/* NPV */}
            <div className="col-md-4">
              <h5 className="text-success">
                💰 Net Present Value (NPV)
              </h5>

              <h3>
                {formatUSD(npv)}
              </h3>
            </div>

            {/* IRR */}
            <div className="col-md-4">
              <h5 className="text-primary">
                📈 Internal Rate of Return (IRR)
              </h5>

              <h3>
                {irr}
                {irr === "not available"
                  ? ""
                  : " %"}
              </h3>
            </div>

            {/* Payback */}
            <div className="col-md-4">
              <h5 className="text-warning">
                ⏱ Payback Period
              </h5>

              <h3>
                {paybackYear
                  ? `Year ${paybackYear}`
                  : "–"}
              </h3>
            </div>

          </div>

          <hr />

          {/* ------------------------------------------------------
              CASHFLOW
          ------------------------------------------------------ */}
          <h6>
            📊 Annual Cash Flow (including Year 0):
          </h6>

          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {cashflows.map((cf, index) => (
              <div key={index}>
                Year {index}:{" "}
                {formatUSD(cf)}
              </div>
            ))}
          </div>

          {/* ------------------------------------------------------
              INTERPRETATION
          ------------------------------------------------------ */}
          <div
            className="alert alert-info mt-3"
            style={{ whiteSpace: "pre-line" }}
          >
            <strong>
              Interpretation:
            </strong>

            <br />

            {interpretation}
          </div>

        </div>
      )}
    </div>
  );
}

export default FinanzielleBewertung;