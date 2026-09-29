// Buchwert.jsx – Version mejorada con Lebensdauer y Abschreibungsmethode + Abschreibung anual
import React, { useState } from "react";
import axios from "axios";

// ✅ FORMATO INTERNATIONAL (GLOBAL)
const formatUS = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

function Buchwert({ onResult }) {
  const [anschaffung, setAnschaffung] = useState("");
  const [alter, setAlter] = useState("");
  const [lebensdauer, setLebensdauer] = useState("25"); // estándar 25 años
  const [methode, setMethode] = useState("linear"); // linear / degressiv
  const [abschreibung, setAbschreibung] = useState(null);
  const [abschreibungJahr, setAbschreibungJahr] = useState(null);
  const [buchwert, setBuchwert] = useState(null);

  const calculateBuchwert = async () => {
    // Parse numeric inputs
    const a = parseFloat(anschaffung);
    const al = parseFloat(alter);
    const ld = parseFloat(lebensdauer);

    if (isNaN(a) || isNaN(al) || isNaN(ld)) {
      alert("Please enter valid numbers!");
      return;
    }

    try {
      let absch = 0;
      let bw = 0;
      let abschJ = 0;

      if (methode === "linear") {
        // Annual depreciation = Initial Investment / Asset Lifetime
        abschJ = a / ld;

        // Accumulated depreciation cannot exceed the Initial Investment
        absch = Math.min(abschJ * al, a);

        // Depreciated Asset Value cannot be negative
        bw = Math.max(a - absch, 0);
      } else if (methode === "degressiv") {
        const t = 0.2; // 20% degressivo
        bw = a;
        absch = 0;

        // Parte entera y decimal del Alter
        const alGanz = Math.floor(al);
        const alDez = al - alGanz;

        // Calcular acumulado y anual promedio
        for (let i = 0; i < alGanz; i++) {
          const jahresAbsch = bw * t;
          bw -= jahresAbsch;
          absch += jahresAbsch;
        }

        if (alDez > 0) {
          const jahresAbsch = bw * t * alDez;
          bw -= jahresAbsch;
          absch += jahresAbsch;
        }

        // Aproximar Abschreibung anual promedio
        abschJ = absch / al;
      }

      const restlaufzeit = Math.max(ld - al, 0);

      // ✅ GUARDAR COMO NÚMERO (NO STRING)
      setAbschreibung(absch);
      setAbschreibungJahr(abschJ);
      setBuchwert(bw);

      if (onResult) {
        onResult({
          anschaffung: a,
          alter: al,
          lebensdauer: ld,
          restlaufzeit: restlaufzeit,
          methode: methode,
          abschreibung: absch,
          abschreibungJahr: abschJ,
          buchwert: bw,
        });
      }
    } catch (error) {
      console.error(error);
      alert("Error calculating the depreciated asset value!");
    }
  };

  return (
    <div className="card mb-4 p-3">
      <h4 className="text-primary fw-bold">3. Depreciated Asset Value</h4>

      <div className="mb-2">
        <label>Initial Investment / CAPEX (USD): e.g. $30,000</label>
        <input
          type="number"
          className="form-control"
          value={anschaffung}
          onChange={(e) => setAnschaffung(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label>Asset Age (years):</label>
        <input
          type="text"
          className="form-control"
          value={alter}
          onChange={(e) => setAlter(e.target.value)}
          placeholder="e.g. 8.5"
        />
      </div>

      <div className="mb-2">
        <label>Expected Asset Lifetime (years): e.g. 25</label>
        <input
          type="number"
          className="form-control"
          value={lebensdauer}
          onChange={(e) => setLebensdauer(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label>Depreciation Method:</label>
        <select
          className="form-select"
          value={methode}
          onChange={(e) => setMethode(e.target.value)}
        >
          <option value="linear">Straight-line</option>
          <option value="degressiv">Declining-balance</option>
        </select>
      </div>

      <button className="btn btn-primary mt-2" onClick={calculateBuchwert}>
        Calculate
      </button>

      {abschreibung !== null && buchwert !== null && (
        <div className="alert alert-success mt-3">
          <h5>Result</h5>

          <p className="mb-1">
            <strong>Annual Depreciation:</strong>{" "}
            ${formatUS(abschreibungJahr)}
          </p>

          <p className="mb-1">
            <strong>Accumulated Depreciation:</strong>{" "}
            ${formatUS(abschreibung)}
          </p>

          <hr />

          <p className="mb-0 fs-5">
            <strong>Depreciated Asset Value:</strong>{" "}
            <span className="fw-bold text-success">
              ${formatUS(buchwert)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default Buchwert;



