import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { FinancialContext } from "./FinancialContext.jsx";

function Ertragswert({ onResult, betriebsmodell, pvgisProduction, anlagengroesse, restlaufzeit }) {
  const kwp = anlagengroesse || "10";
  const [spezErtrag, setSpezErtrag] = useState("1000");
  const [verguetung, setVerguetung] = useState("8,50");
  const [restlaufzeitState, setRestlaufzeitState] = useState(restlaufzeit || "");
  const [pr, setPr] = useState("80");
  const [degradation, setDegradation] = useState("0,5");

  const { opex, setOpex } = useContext(FinancialContext);

  const [strompreis, setStrompreis] = useState("0,30");
  const [eigenverbrauchAnteil, setEigenverbrauchAnteil] = useState("30");
  const [mieterstromAnteil, setMieterstromAnteil] = useState("40");
  const [mieterstromZuschlag, setMieterstromZuschlag] = useState("0,01");

  const [jahresertragBrutto, setJahresertragBrutto] = useState(null);
  const [ertragswertKumuliert, setErtragswertKumuliert] = useState(null);
  const [ertragswertProJahr, setErtragswertProJahr] = useState(null);
  const [autoVerguetung, setAutoVerguetung] = useState(null);
  const [eegPeriod, setEegPeriod] = useState("Feb-Jul 2026");
  const [npvState, setNpvState] = useState(null);

  const parseEuroFloat = (val) => {
    if (typeof val === "number") return val;
    return parseFloat(String(val).replace(",", "."));
  };

  const isDirektvermarktung =
    parseEuroFloat(kwp) > 100 &&
    (
      betriebsmodell === "volleinspeisung" ||
      betriebsmodell === "eigenverbrauch" ||
      betriebsmodell === "eigenverbrauch_batterie"
    );  

  const formatEuro = (valor) => {
    if (valor === null || valor === undefined) return "0,00";
    return parseFloat(valor).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercent = (valor) => {
  const num = parseEuroFloat(valor);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

  const tarifsData = useMemo(() => {
    const size = parseEuroFloat(kwp) || 0;
    const evAnteil = parseEuroFloat(eigenverbrauchAnteil) || 0;
    // Consideramos autoconsumo si el modelo incluye la palabra "eigenverbrauch"
    const isAutoconsumo = betriebsmodell?.toLowerCase().includes("eigenverbrauch");
    const isVolleinspeisung = (evAnteil === 0 || betriebsmodell === "volleinspeisung");

    const getTarifSet = (v10, vOther, e10, e40, eOther, m10, m40, m100, mOther) => ({
      volleinspeisung: size <= 10 ? v10 : vOther,
      eigenverbrauch: isVolleinspeisung 
        ? (size <= 10 ? v10 : vOther) 
        : (size <= 10 ? e10 : size <= 40 ? e40 : eOther),
      mieterstrom: size <= 10 ? m10 : size <= 40 ? m40 : size <= 100 ? m100 : mOther,
    });

    return {
      h1: getTarifSet(12.34, 10.35, 7.78, 6.73, 5.50, 2.56, 2.38, 2.38, 1.60),
      h2: getTarifSet(12.22, 10.25, 7.70, 6.66, 5.45, 2.51, 2.35, 2.35, 1.58),
      h3: getTarifSet(12.09, 10.14, 7.63, 6.60, 5.39, 2.49, 2.33, 2.33, 1.56),
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

          return null; // >1000 kWp Sonderfall
      }

      if (size <= 10) return tarif.teil10;

      if (size <= 40) return tarif.teil40;

      return tarif.teilOther;
    };


    // CORRECCIÓN AQUÍ: Normalizamos el nombre del modelo para que coincida con las claves de tarifas
    let modelKey = betriebsmodell;
    if (betriebsmodell?.toLowerCase().includes("eigenverbrauch")) {
      modelKey = "eigenverbrauch";
    }

    const autoValue = betriebsmodell === "direktvermarktung" 
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

  useEffect(() => {
  if (restlaufzeit !== undefined) {
    setRestlaufzeitState(String(restlaufzeit));
    }
  }, [restlaufzeit]);

  const calculateErtragswert = async () => {

    if (isDirektvermarktung) {
      alert(
        "Anlagen über 100 kWp werden über Direktvermarktung (Marktprämienmodell) vergütet."
      );
      return;
    }

    const k = parseEuroFloat(kwp);
    const seInput = parseEuroFloat(spezErtrag);
    const v = parseEuroFloat(verguetung);
    const rl = parseEuroFloat(restlaufzeitState);
    const prVal = parseEuroFloat(pr);
    const degr = parseEuroFloat(degradation);
    const opexVal = parseEuroFloat(opex);

    if ([k, seInput, v, rl, prVal, degr, opexVal].some(isNaN)) {
      alert("Bitte gültige Zahlen eingeben!");
      return;
    }

    const rawEvAnteil = parseEuroFloat(eigenverbrauchAnteil);
    let ea = rawEvAnteil > 1 ? rawEvAnteil / 100 : rawEvAnteil;
    if (betriebsmodell === "mieterstrom" || betriebsmodell === "volleinspeisung") { ea = 0; }

    const pvProduction =
      pvgisProduction?.annual_production || (k * seInput);
    const se = pvProduction && k > 0 ? pvProduction / k : seInput;
    const vergütungEuro = v / 100;
    const strompreisEuro = parseEuroFloat(strompreis);
    const mieterstromZuschlagEuro = parseEuroFloat(mieterstromZuschlag);

    let jahresBrutto;
    if (betriebsmodell === "mieterstrom") {
      const rawMaAnteil = parseEuroFloat(mieterstromAnteil);
      const ma = rawMaAnteil > 1 ? rawMaAnteil / 100 : rawMaAnteil;
      jahresBrutto = pvProduction * (prVal / 100) * (ma * (strompreisEuro + mieterstromZuschlagEuro) + (1 - ma) * vergütungEuro);
    } else {
      jahresBrutto = k * se * (prVal / 100) * (ea * strompreisEuro + (1 - ea) * vergütungEuro);
    }

    let ertragsKumuliert = 0;
    let npv = 0;
    const discountRate = 0.05;
    let currentJahrProd = jahresBrutto;

    for (let i = 1; i <= rl; i++) {
      const netCashflow = currentJahrProd - opexVal;
      ertragsKumuliert += netCashflow;
      npv += netCashflow / Math.pow(1 + discountRate, i);
      currentJahrProd *= (1 - degr / 100);
    }

    const res = {
      anlagengroesse: k,
      spezifischer_ertrag: seInput,
      jahresertrag: pvProduction,
      einspeiseverguetung: v,
      restlaufzeit: rl,
      performance_ratio: prVal,
      degradacion_anual: degr,
      opex_anual: opexVal,
      jahresertragBrutto: jahresBrutto.toFixed(2),
      ertragswertKumuliert: ertragsKumuliert.toFixed(2),
      ertragswertProJahr: (ertragsKumuliert / rl).toFixed(2),
      npv: npv.toFixed(2),
      betriebsmodell,
      eeg_period: eegPeriod,
      strompreis: strompreisEuro,
      eigenverbrauch_anteil: ea
    };

    setJahresertragBrutto(res.jahresertragBrutto);
    setErtragswertKumuliert(res.ertragswertKumuliert);
    setErtragswertProJahr(res.ertragswertProJahr);
    setNpvState(res.npv);

    if (onResult) onResult(res);

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/ertragswert`, res);
    } catch (error) { console.error("Error Ertragswert:", error); }
  };

  return (
    <div className="card mb-4 p-3">
      <h4 className="text-primary fw-bold">4. Ertragswert berechnen </h4>
      
      <div className="row">
        <div className="col-md-6 mb-2">
          <label>Anlagengröße (kWp):</label>
          <input 
            type="text" 
            className="form-control" 
            value={kwp}
            readOnly
            placeholder="10"
          />
          <div className="form-text">
          Automatisch aus den Anlagendaten übernommen
          </div>
        </div>
        <div className="col-md-6 mb-2">
          <label>Spezifischer Ertrag (kWh/kWp): Falls unbekannt, mit PVGIS unten ermitteln</label>
          <input type="text" className="form-control" value={spezErtrag} onChange={(e) => setSpezErtrag(e.target.value)} placeholder="1000" />
          {pvgisProduction?.production != null && (
            <small className="text-primary">
              PVGIS: {formatEuro(pvgisProduction.production)} kWh/a • ca. {formatEuro(pvgisProduction.production / (parseEuroFloat(kwp) || 1))} kWh/kWp
            </small>
          )}
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-md-4 mb-2">
          <label>Strompreis Eigenverbrauch (€/kWh):</label>
          <input type="text" className="form-control" value={strompreis} onChange={(e) => setStrompreis(e.target.value)} disabled={betriebsmodell === "volleinspeisung"} />
          <small className="text-muted">Durchschnittlicher Strompreis in Deutschland: ca. 28 – 35 ct/kWh</small>
        </div>
        <div className="col-md-4 mb-2">
          <label>Eigenverbrauch-Anteil (%):</label>
          <input type="text" className="form-control" value={eigenverbrauchAnteil} onChange={(e) => setEigenverbrauchAnteil(e.target.value)} disabled={betriebsmodell === "volleinspeisung"} />
          <small className="text-muted">Eigenverbrauch: 30 – 70% (Rest Einspeisung)</small>
        </div>
        {betriebsmodell === "mieterstrom" && (
          <>
            <div className="col-md-4 mb-2">
              <label>Mieterstrom-Anteil (%):</label>
              <input type="text" className="form-control" value={mieterstromAnteil} onChange={(e) => setMieterstromAnteil(e.target.value)} />
            </div>
            <div className="col-md-4 mb-2">
              <label>Mieterstrom-Zuschlag (€/kWh):</label>
              <input type="text" className="form-control" value={mieterstromZuschlag} onChange={(e) => setMieterstromZuschlag(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="alert alert-success mb-3">
        <div className="row align-items-center">
          <div className="col-md-4"><strong>📊 Modell:</strong><br /><span className="badge bg-success fs-6 mt-1">{betriebsmodell.toUpperCase()}</span></div>
          <div className="col-md-4">
            {isDirektvermarktung ? (
              <>
                <strong>⚡ Vergütung:</strong><br />
                <span className="badge bg-info fs-6 mt-1">
                  Direktvermarktung
                </span>
              </>
            ) : (
              <>
                <strong>⚡ AUTO-Vergütung:</strong><br />
                <span className="badge bg-warning fs-6 mt-1">
                  {formatEuro(autoVerguetung)} ct/kWh
                </span>
              </>
            )}
          </div>
          <div className="col-md-4"><strong>📅 EEG-Periode:</strong><br /><span className="badge bg-primary fs-6 mt-1">{eegPeriod}</span></div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-2">
          <label>Restlaufzeit (Jahre):</label>
          <input type="text" className="form-control" value={restlaufzeitState} onChange={(e) => setRestlaufzeitState(e.target.value)} />
          <small className="text-muted">Geschätzte Lebensdauer - Alter der PV-Anlage</small>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-md-4 mb-2">
          <label>Performance Ratio (PR %):</label>
          <input type="number" className="form-control" value={pr} onChange={(e) => setPr(e.target.value)} />
          <small className="text-muted">zw. 75 – 85 % Typischer Wert für Dachanlagen in DE</small>
        </div>
        <div className="col-md-4 mb-2">
          <label>Jährliche Degradation (% / Jahr):</label>
          <input type="text" className="form-control" value={degradation} onChange={(e) => setDegradation(e.target.value)} />
          <small className="text-muted">zw. 0,3 – 0,8 % Typischer Wert</small>
        </div>
        <div className="col-md-4 mb-2">
          <label>Betriebskosten (OPEX) pro Jahr (€):</label>
          <input type="text" className="form-control" value={opex} onChange={(e) => setOpex(e.target.value)} />
          <small className="text-muted">ca. 1 – 2 % der Investitionskosten (CAPEX) / Jahr, inkl. Wartung, Monitoring, Versicherung & Verwaltung</small>
        </div>
      </div>

      <button className="btn btn-primary btn-lg w-100 mt-3" onClick={calculateErtragswert}>💰 Ertragswert berechnen</button>

      {jahresertragBrutto !== null && (
        <div className="alert alert-success mt-4">
          
          <h5 className="mb-3 fs-5 fw-bold">Ergebnis</h5>

          <div className="row text-center">
            
            <div className="col-md-3 mb-2">
              <div className="text-muted fs-6 fw-bold">📈 Jährlicher Ertrag (Brutto)</div>
              <div className="fs-5 fw-bold text-success">
                {formatEuro(jahresertragBrutto)} €
              </div>
            </div>

            <div className="col-md-3 mb-2">
              <div className="text-muted fs-6 fw-bold">📊 Ertragswert  / Jahr</div>
              <div className="fs-5 fw-bold text-success">
                {formatEuro(ertragswertProJahr)} €
              </div>
            </div>

            <div className="col-md-3 mb-2">
              <div className="text-muted fs-6 fw-bold">💰 Kumuliert</div>
              <div className="fs-5 fw-bold text-success">
                {formatEuro(ertragswertKumuliert)} €
              </div>
            </div>

            <div className="col-md-3 mb-2">
              <div className="text-muted fs-6 fw-bold">📉 NPV</div>
              <div className="fs-5 fw-bold text-success">
                {formatEuro(npvState)} €
              </div>
            </div>

          </div>

          <hr />

          <p className="mb-0 text-center text-muted fs-6">
           ✅ <strong>Berechnet mit:</strong> {betriebsmodell.toUpperCase()} • 
            EEG {eegPeriod} • 
            <br />
            PR {formatPercent(pr)}% • Degradation {formatEuro(parseEuroFloat(degradation))}% • 
            OPEX {formatEuro(opex)} €
          </p>

        </div>
      )}
    </div>
  );
}

export default Ertragswert;