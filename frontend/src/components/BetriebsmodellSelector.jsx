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
          Die gesamte erzeugte Energie wird vollständig in das öffentliche Netz eingespeist 
          und gemäß EEG vergütet.<br /><br />

          • ca. 12,22 ct/kWh (bis 10 kWp Volleinspeisung)<br />
          • ca. 10,25 ct/kWh (über 10 bis 100 kWp Volleinspeisung)<br /><br />

          ⚠️ <strong>Achtung!</strong> Die EEG-Vergütung wird gestaffelt nach Leistungsanteilen berechnet.
          Eine PV-Anlage erhält daher nicht automatisch den Vergütungssatz der letzten Leistungsstufe 
          für die gesamte Anlagenleistung.<br /><br />

          <strong>Beispiel (50 kWp-Volleinspeisungsanlage):</strong><br />
          Eine 50 kWp-Anlage erhält nicht automatisch 10,25 ct/kWh für die gesamte Strommenge.<br /><br />

          Die Vergütung wird entsprechend den einzelnen Leistungsstufen berechnet:<br /><br />

          • Die ersten 10 kWp werden mit ca. 12,22 ct/kWh vergütet.<br />
          • Die verbleibenden 40 kWp (über 10 bis 100 kWp) werden mit ca. 10,25 ct/kWh vergütet.<br /><br />

          Der effektive Vergütungssatz ergibt sich somit aus der gewichteten Berechnung 
          der einzelnen Leistungsanteile.<br /><br />

          <strong>Wirtschaftlicher Nutzen:</strong><br />
          Einnahmen aus Einspeisung = PV-Produktion × EEG-Einspeisevergütung<br /><br />

          <strong>Anlagen über 100 kWp:</strong><br />
          • Bei Solaranlagen mit mehr als 100 kWp installierter Leistung ist grundsätzlich 
          die Direktvermarktung erforderlich.<br />
          • Die EEG-Förderung erfolgt in der Regel über das Marktprämienmodell; 
          eine klassische feste Einspeisevergütung wird nicht automatisch gewährt.
        </p>
        )}
        {value === "eigenverbrauch" && (
          <p>
          Ein Teil des Solarstroms wird direkt selbst verbraucht, der überschüssige Strom wird in das öffentliche Netz eingespeist.<br /><br />

          <strong>Einspeisevergütung gemäß EEG (Teileinspeisung, Inbetriebnahme 01.08.2026–31.01.2027):</strong><br />
          • ca. 7,70 ct/kWh (bis 10 kWp Teileinspeisung)<br />
          • ca. 6,66 ct/kWh (über 10 bis 40 kWp Teileinspeisung)<br />
          • ca. 5,45 ct/kWh (über 40 bis 100 kWp Teileinspeisung)<br /><br />

          ⚠️ <strong>Achtung!</strong> Die EEG-Vergütung wird gestaffelt nach Leistungsanteilen berechnet.
          Eine 50 kWp-Anlage erhält daher nicht automatisch 5,45 ct/kWh für die gesamte eingespeiste Strommenge.<br /><br />

          <strong>Beispiel (50 kWp-Anlage):</strong><br />
          • Die ersten 10 kWp werden mit ca. 7,70 ct/kWh vergütet.<br />
          • Die nächsten 30 kWp (über 10 bis 40 kWp) werden mit ca. 6,66 ct/kWh vergütet.<br />
          • Die verbleibenden 10 kWp (über 40 bis 100 kWp) werden mit ca. 5,45 ct/kWh vergütet.<br /><br />

          <strong>Wirtschaftlicher Nutzen:</strong><br />
          Ersparnis durch Eigenverbrauch + EEG-Einnahmen aus Einspeisung<br /><br />

          <strong>Beispiel: 50 kWp-Anlage mit 40 % Eigenverbrauch:</strong><br />
          • Eigenverbrauch: 20.000 kWh × 0,30 €/kWh ≈ 6.000 €/Jahr<br />
          • Netzeinspeisung: 30.000 kWh × gestaffelte EEG-Vergütung (Ø ca. 6,63 ct/kWh) ≈ 1.990 €/Jahr<br />
          → wirtschaftlicher Nutzen ≈ 7.990 €/Jahr<br /><br />

          <strong>Anlagen über 100 kWp:</strong><br />
          • Bei Solaranlagen mit mehr als 100 kWp installierter Leistung ist grundsätzlich die Direktvermarktung erforderlich.<br />
          • Die EEG-Förderung erfolgt in der Regel über das Marktprämienmodell; eine klassische feste Einspeisevergütung wird nicht gewährt.
        </p>
        )}
        {value === "eigenverbrauch_batterie" && (
            <p>
              Durch Batteriespeicher kann der Eigenverbrauchsanteil deutlich erhöht und dadurch 
              die Stromkosteneinsparung gesteigert werden. Ein Teil des Solarstroms wird selbst 
              verbraucht, der überschüssige Strom wird in das öffentliche Netz eingespeist.<br /><br />

              Die Netzeinspeisung wird gemäß EEG vergütet:<br />
              • ca. 7,70 ct/kWh (bis 10 kWp Leistungsanteil, Teileinspeisung).<br />
              • ca. 6,66 ct/kWh (über 10 bis 40 kWp Leistungsanteil, Teileinspeisung).<br />
              • ca. 5,45 ct/kWh (über 40 bis 100 kWp Leistungsanteil, Teileinspeisung).<br /><br />

              ⚠️ <strong>Achtung!</strong> Die EEG-Vergütung wird gestaffelt nach Leistungsanteilen 
              der installierten Anlagenleistung berechnet. Eine 50 kWp-Anlage erhält daher nicht 
              automatisch 5,45 ct/kWh für die gesamte eingespeiste Strommenge.<br /><br />

              <strong>Beispiel (50 kWp-Anlage):</strong><br />
              • Die ersten 10 kWp Leistungsanteil werden mit ca. 7,70 ct/kWh vergütet.<br />
              • Die nächsten 30 kWp (über 10 bis 40 kWp) werden mit ca. 6,66 ct/kWh vergütet.<br />
              • Die verbleibenden 10 kWp (über 40 bis 100 kWp) werden mit ca. 5,45 ct/kWh vergütet.<br /><br />

              <strong>Wirtschaftlicher Nutzen:</strong><br />
              Ersparnis durch Eigenverbrauch + EEG-Einnahmen aus Einspeisung<br /><br />

              <strong>Beispiel (typischer Wert): 50 kWp-Anlage mit Batteriespeicher und 70 % Eigenverbrauch:</strong><br />
              Durch den Batteriespeicher wird ein größerer Anteil der erzeugten Energie selbst genutzt 
              und die Einspeisung ins öffentliche Netz reduziert.<br /><br />

              • Eigenverbrauch: 35.000 kWh × 0,30 €/kWh ≈ 10.500 €/Jahr<br />
              • Netzeinspeisung: 15.000 kWh × gestaffelte EEG-Vergütung 
              (Ø ca. 6,63 ct/kWh) ≈ 995 €/Jahr<br /><br />

              → wirtschaftlicher Nutzen ≈ 11.495 €/Jahr<br /><br />

              <strong>Anlagen über 100 kWp:</strong><br />
              • Bei Solaranlagen mit mehr als 100 kWp installierter Leistung ist grundsätzlich 
              die Direktvermarktung erforderlich.<br />
              • Die EEG-Förderung erfolgt in der Regel über das Marktprämienmodell; eine klassische 
              feste Einspeisevergütung wird nicht gewährt.
            </p>
        )}
        {value === "mieterstrom" && (
          <p>
            Der erzeugte Strom wird direkt an Mieter im Gebäude verkauft. 
            Überschüsse werden in das öffentliche Netz eingespeist.<br /><br />

            <strong>Mieterstromzuschlag gemäß EEG (Inbetriebnahme 01.08.2026–31.01.2027):</strong><br />
            • ca. 2,51 ct/kWh (bis 10 kWp)<br />
            • ca. 2,35 ct/kWh (über 10 bis 40 kWp)<br />
            • ca. 1,58 ct/kWh (über 40 bis 1.000 kWp)<br /><br />

            ⚠️ <strong>Achtung!</strong> Die EEG-Vergütung für eingespeiste Überschüsse wird 
            gestaffelt nach Leistungsanteilen berechnet. Die Einspeisevergütung für Überschüsse 
            gilt daher nicht automatisch für die gesamte Anlagenleistung, sondern wird entsprechend 
            den einzelnen Leistungsstufen angewendet.<br /><br />

            <strong>Beispiel (50 kWp-Mieterstromanlage):</strong><br />
            Eine 50 kWp-Anlage erhält nicht automatisch die Vergütung der letzten Leistungsstufe 
            für die gesamte Leistung. Die Berechnung erfolgt anteilig nach den jeweiligen Leistungsstufen:<br /><br />

            • Die ersten 10 kWp werden gemäß dem entsprechenden EEG-Vergütungssatz vergütet.<br />
            • Die nächsten 30 kWp (über 10 bis 40 kWp) werden mit dem jeweiligen Folgesatz vergütet.<br />
            • Die verbleibenden 10 kWp (über 40 bis 100 kWp) werden mit dem entsprechenden Satz dieser Leistungsstufe vergütet.<br /><br />

            Der anzulegende Wert bzw. die Einspeisevergütung ergibt sich somit aus der gewichteten Berechnung 
            der einzelnen Leistungsanteile.<br /><br />

            <strong>Anlagen über 1.000 kWp:</strong><br />
            • Der Mieterstrombetrieb ist grundsätzlich weiterhin möglich.<br />
            • Für eingespeiste Überschüsse können jedoch zusätzliche Anforderungen der Direktvermarktung 
            bzw. des Marktprämienmodells gelten.<br />
            • Die wirtschaftliche Bewertung hängt daher von der konkreten Vermarktungsstruktur, 
            den Stromlieferverträgen und den jeweiligen Marktbedingungen ab.<br /><br />

            <strong>Wirtschaftlicher Nutzen:</strong><br />
            Mieterstromerlöse + EEG-Einnahmen aus der Netzeinspeisung<br /><br />

            Mieterstromerlöse = PV-Produktion × Mieterstromanteil × (Strompreis Mieter + Mieterstromzuschlag)<br /><br />

            EEG-Einnahmen = Überschussstrom × EEG-Vergütung bzw. Marktprämie<br /><br />

            <strong>Beispiel wirtschaftlicher Nutzen:</strong><br />
            40.000 kWh Jahresproduktion mit 40 % Mieterstromanteil:<br /><br />

            Mieterstromerlöse ≈ 5.040 €<br />
            EEG-Einnahmen aus Netzeinspeisung ≈ 1.848 €<br /><br />

            → <strong>wirtschaftlicher Nutzen ≈ 6.888 €/Jahr</strong>
          </p>
        )}
        {value === "direktvermarktung" && (
          <p>
            Der erzeugte Strom wird direkt am Strommarkt vermarktet (typisch für größere PV-Anlagen). 
            Die EEG-Förderung erfolgt über das Marktprämienmodell mit einem festgelegten anzulegenden Wert.<br /><br />

            <strong>Anzulegende Werte gemäß EEG (Inbetriebnahme 08/2026–01/2027, Anlagen bis 1.000 kWp):</strong><br />

            • ca. 8,10 ct/kWh (bis 10 kWp Teileinspeisung) / 12,61 ct/kWh (Volleinspeisung)<br />
            • ca. 7,06 ct/kWh (über 10 bis 40 kWp Teileinspeisung) / 10,64 ct/kWh (Volleinspeisung)<br />
            • ca. 5,84 ct/kWh (über 40 bis 100 kWp Teileinspeisung) / 10,64 ct/kWh (Volleinspeisung)<br />
            • ca. 5,84 ct/kWh (über 100 bis 400 kWp Teileinspeisung) / 8,85 ct/kWh (Volleinspeisung)<br />
            • ca. 5,84 ct/kWh (über 400 bis 1.000 kWp Teileinspeisung) / 7,62 ct/kWh (Volleinspeisung)<br /><br />

            ⚠️ <strong>Achtung!</strong> Die anzulegenden Werte werden gestaffelt nach Leistungsanteilen berechnet.
            Eine PV-Anlage erhält daher nicht automatisch den Wert der letzten Leistungsstufe für die gesamte Anlagenleistung.<br /><br />

            <strong>Beispiel (50 kWp-Anlage):</strong><br />
            Eine 50 kWp-Anlage erhält nicht automatisch 5,84 ct/kWh für die gesamte eingespeiste Strommenge.
            Die Vergütung wird entsprechend den einzelnen Leistungsstufen berechnet:<br /><br />

            • Die ersten 10 kWp werden mit ca. 8,10 ct/kWh vergütet.<br />
            • Die nächsten 30 kWp (über 10 bis 40 kWp) werden mit ca. 7,06 ct/kWh vergütet.<br />
            • Die verbleibenden 10 kWp (über 40 bis 100 kWp) werden mit ca. 5,84 ct/kWh vergütet.<br /><br />

            Der anzulegende Wert ergibt sich somit aus der gewichteten Berechnung der einzelnen Leistungsanteile.<br /><br />

            <strong>Anlagen über 1.000 kWp:</strong><br />
            • Die Vermarktung erfolgt weiterhin über die Direktvermarktung am Strommarkt.<br />
            • Eine automatische Berechnung mit festen EEG-Werten bis 1.000 kWp ist nicht mehr vorgesehen.<br />
            • Die Erlöse hängen von den individuellen Vermarktungsverträgen, Marktpreisen und der jeweiligen Marktprämie ab.<br /><br />

            <strong>Wirtschaftlicher Nutzen:</strong><br />
            Erlöse aus der Direktvermarktung + Marktprämie gemäß EEG.<br /><br />

            Ein zusätzlicher Eigenverbrauch kann den wirtschaftlichen Nutzen erhöhen.
            Der verbleibende Stromanteil wird über die Direktvermarktung vermarktet.
          </p>
        )}
      </div>
    </div>
  );
}

export default BetriebsmodellSelector;








