import React from "react";

function BetriebsmodellSelector({ value, onChange }) {
  const handleChange = (e) => {
    const selectedModel = e.target.value;
    if (onChange) {
      onChange(selectedModel);
    }
  };

  return (
    <div className="card mb-4 p-3">
      <h4 className="text-primary fw-bold">2. Betriebsmodell der PV-Anlage</h4>

      <div className="mb-2">
        <label className="form-label">
          Bitte Betriebsmodell auswählen (5 Optionen): <span className="badge bg-info">PRO</span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              color: "#007bff",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            ▼
          </span>

          <select
            className="form-control"
            style={{ flex: 1 }}
            value={value || "volleinspeisung"}
            onChange={handleChange}
          >
            <option value="volleinspeisung">
              Volleinspeisung (100 % Einspeisung ins Netz)
            </option>
            <option value="eigenverbrauch">
              Eigenverbrauch + Teileinspeisung
            </option>
            <option value="eigenverbrauch_batterie">
              Eigenverbrauch mit Batterie
            </option>
            <option value="mieterstrom">
              Mieterstrom-Modell (1-1000 kWp → Mieterstromzuschlag)
            </option>
            <option value="direktvermarktung">
              Direktvermarktung / Marktprämie (&gt;100 kWp → Pflicht)
            </option>
          </select>
        </div>
      </div>

      <div className="alert alert-success mt-3">
        {value === "volleinspeisung" && (
          <p>
            Die gesamte erzeugte Energie wird ins Netz eingespeist und gemäß EEG
            vergütet: <br></br><br></br>
            • ca. 12,22 ct/kWh (bis 10 kWp Volleinspeisung)<br></br>
            • ca. 10,25 ct/kWh (über 10 bis 100 kWp Volleinspeisung)<br></br>
            • ca. 10,25 ct/kWh (über 100 kWp bis 100 kWp Volleinspeisung)<br></br>
            Ab 100 kWp zur „Direktvermarktung“ verpflichtet, keine feste Vergütung

          </p>
        )}
        {value === "eigenverbrauch" && (
          <p>
            Ein Teil des Solarstroms wird selbst verbraucht, der Rest ins Netz eingespeist.<br></br><br></br>  
            Einspeisung wird gemäß EEG vergütet:<br></br> 
            • ca. 7,70 ct/kWh (bis 10 kW Teileinspeisung) / 12,22 ct/kWh (Volleinspeisung)<br></br> 
            • 6,66 ct/kWh (bis 40 kW Teileinspeisung) / 10,25 ct/kWh (Volleinspeisung)<br></br> 
            • 5,45 ct/kWh (bis 100 kW Teileinspeisung) / 10,25 ct/kWh (Volleinspeisung)<br></br><br></br>  
            Ab 100 kWp zur „Direktvermarktung“ verpflichtet, keine feste Vergütung<br></br> 
          </p>
        )}
        {value === "eigenverbrauch_batterie" && (
            <p>
              Durch Batteriespeicher kann der Eigenverbrauchsanteil deutlich
            erhöht werden.<br></br>  
            Ein Teil des Solarstroms wird selbst verbraucht, der Rest ins Netz eingespeist.<br></br><br></br>  
            Einspeisung wird gemäß EEG vergütet:<br></br> 
            • ca. 7,70 ct/kWh (bis 10 kW Teileinspeisung) / 12,22 ct/kWh (Volleinspeisung)<br></br> 
            • 6,66 ct/kWh (bis 40 kW Teileinspeisung) / 10,25 ct/kWh (Volleinspeisung)<br></br> 
            • 5,45 ct/kWh (bis 100 kW Teileinspeisung) / 10,25 ct/kWh (Volleinspeisung)<br></br><br></br>  
            Ab 100 kWp zur „Direktvermarktung“ verpflichtet, keine feste Vergütung<br></br> 
          </p>
        )}
        {value === "mieterstrom" && (
          <p>
            Der erzeugte Strom wird direkt an Mieter im Gebäude verkauft. Überschüsse ins Netz. <br></br><br></br>
            Mieterstromzuschlag gemäß EEG (Inbetriebnahme 01.08.2026–31.01.2027):<br></br>
            • ca. 2,51 ct/kWh (bis 10 kWp Mieterstromzuschlag)<br></br>
            • 2,35 ct/kWh (bis 40 kWp Mieterstromzuschlag)<br></br>
            • 2,35 ct/kWh (bis 100 kWp Mieterstromzuschlag)<br></br>
            • 1,58 ct/kWh (ab 100–1000 kWp Mieterstromzuschlag)<br></br><br></br>
            Einnahmen = Mieterstrom + Einspeisung<br></br>
            Mieterstrom = PV-Produktion × Mieterstromanteil × (Strompreis Mieter + Mieterstromzuschlag)<br></br>
            Einspeisung = PV-Produktion × (1 − Mieterstromanteil) × EEG-Vergütung (ca. 7,70 ct/kWh)<br></br><br></br>
            Beispiel: 40.000 kWh → 40 % Mieterstrom ≈ 5.050 € / 60 % Einspeisung ≈ 1.320 € → Jahreseinnahmen ≈ 6.370 €.
          </p>
        )}
        {value === "direktvermarktung" && (
          <p>
            Der Strom wird direkt am Strommarkt verkauft (typisch für größere Anlagen).<br></br><br></br>
            Für Anlagen bis 1.000 kW (Inbetriebnahme 08/2026–01/2027) gelten folgende anzulegende Werte:<br></br>
          • ca. 8,10 ct/kWh (bis 10 kWp Teileinspeisung) / 12,61 ct/kWh (Volleinspeisung)<br></br>
          • ca. 7,06 ct/kWh (über 10 bis 40 kWp Teileinspeisung) / 10,64 ct/kWh (Volleinspeisung)<br></br>
          • ca. 5,84 ct/kWh (über 40 bis 100 kWp Teileinspeisung) / 10,64 ct/kWh (Volleinspeisung)<br></br>
          • ca. 5,84 ct/kWh (über 100 bis 400 kWp Teileinspeisung) / 8,85 ct/kWh (Volleinspeisung)<br></br>
          • ca. 5,84–7,62 ct/kWh (über 400 bis 1.000 kWp, abhängig von der Volleinspeisung)<br></br><br></br>
            Typisch: 30–60 % Eigenverbrauch (mit Speicher), 20–40 % ohne; Rest (40–70 %) Einspeisung.<br></br>
          </p>
        )}
      </div>
    </div>
  );
}

export default BetriebsmodellSelector;








