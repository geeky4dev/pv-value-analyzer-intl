import React, { useState, useEffect } from "react";
import { Tooltip } from "bootstrap";

function AnlagenDaten({ onDataChange, betriebsmodell, anlagenData }) {
  // 1. EL ESTADO INICIAL COMPLETO
  const [formData, setFormData] = useState({
    adresse: "",
    plz: "",
    ort: "",
    bundesland: "",
    firma: "",
    email: "",
    telefon: "",
    leistung: "",
    inbetriebnahme: "",
    modultyp: "",
    modulhersteller: "",
    modellmodule: "",
    wrtyp: "",
    wrhersteller: "",
    wrmodell: "",
    wrinstallationsjahr: "",
    wraustausch: "Nein",
    installationsart: "",
    dachneigung: "",
    azimut: "",
    breitengrad: "",
    langengrad: "",
    zustand: "",
    letztewartung: "",
    wartungsvertrag: "Nein",
    probleme: ""
  });

  // 2. ACTUALIZACIÓN DESDE PVGIS
  useEffect(() => {
    if (anlagenData) {
      setFormData((prev) => ({
        ...prev,
        breitengrad: anlagenData.latitude || prev.breitengrad,
        langengrad: anlagenData.longitude || prev.langengrad
      }));
    }
  }, [anlagenData]);

  // Bootstrap Tooltips
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );

    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new Tooltip(tooltipTriggerEl);
    });
  }, []);

  // 3. FUNCIÓN DE CAMBIO
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? (checked ? "Ja" : "Nein") : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      if (onDataChange) {
        onDataChange(updated);
      }

      return updated;
    });
  };

  return (
    <div className="card mb-4 p-3 shadow-sm">
      <h4 className="border-bottom pb-2 text-primary fw-bold">1. Anlagendaten</h4>

      <div className="accordion mt-3" id="anlagenAccordion">

        {/* ====================================================== */}
        {/* 1.1 Allgemeine Angaben */}
        {/* ====================================================== */}

        <div className="accordion-item">

          <h2 className="accordion-header" id="headingGeneral">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseGeneral"
              aria-expanded="true"
              aria-controls="collapseGeneral"
            >
              1.1. Allgemeine Angaben
            </button>
          </h2>

          <div
            id="collapseGeneral"
            className="accordion-collapse collapse show"
            aria-labelledby="headingGeneral"
            data-bs-parent="#anlagenAccordion"
          >
            <div className="accordion-body">

              <div className="row g-2">

                <div className="col-md-12">
                  <label>1.1.1 Adresse:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Musterstraße 1"
                  />
                </div>

                <div className="col-md-4">
                  <label>1.1.2 PLZ:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="plz"
                    value={formData.plz}
                    onChange={handleChange}
                    placeholder="54321"
                  />
                </div>

                <div className="col-md-4">
                  <label>1.1.3 Ort:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ort"
                    value={formData.ort}
                    onChange={handleChange}
                    placeholder="Musterstadt"
                  />
                </div>

                <div className="col-md-4">
                  <label>1.1.4 Bundesland:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="bundesland"
                    value={formData.bundesland}
                    onChange={handleChange}
                    placeholder="Bundesland angeben"
                  />
                </div>

                <div className="col-md-12">
                  <label>1.1.5 Firma:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firma"
                    value={formData.firma}
                    onChange={handleChange}
                    placeholder="Musterfirma GmbH"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.6 E-Mail:</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@musterfirma.de"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.7 Telefon:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleChange}
                    placeholder="055 12345678"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.8 Anlagenleistung (kWp):</label>
                  <input
                    type="number"
                    className="form-control"
                    name="leistung"
                    value={formData.leistung}
                    onChange={handleChange}
                    placeholder="z.B. 10"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.9 Inbetriebnahme (Monat/Jahr):</label>
                  <input
                    type="month"
                    className="form-control"
                    name="inbetriebnahme"
                    value={formData.inbetriebnahme}
                    onChange={handleChange}
                  />
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ====================================================== */}
        {/* 1.2 Technische Details */}
        {/* ====================================================== */}

        <div className="accordion-item">

          <h2 className="accordion-header" id="headingTechnical">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseTechnical"
              aria-expanded="false"
              aria-controls="collapseTechnical"
            >
              1.2. Technische Details
            </button>
          </h2>

          <div
            id="collapseTechnical"
            className="accordion-collapse collapse"
            aria-labelledby="headingTechnical"
            data-bs-parent="#anlagenAccordion"
          >
            <div className="accordion-body">

              <div className="row g-2">

                <div className="col-md-4">
                  <label>1.2.1 Modultyp:</label>

                  <select
                    className="form-select"
                    name="modultyp"
                    value={formData.modultyp}
                    onChange={handleChange}
                  >
                    <option value="">Bitte auswählen</option>

                    <option value="Monokristallin">
                      Monokristallin
                    </option>

                    <option value="Polykristallin">
                      Polykristallin
                    </option>

                    <option value="Dünnschicht">
                      Dünnschicht
                    </option>

                    <option value="Bifazial">
                      Bifazial
                    </option>

                  </select>
                </div>

                <div className="col-md-4">
                  <label>1.2.2 Hersteller Module:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="modulhersteller"
                    value={formData.modulhersteller}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.3 Modell Module:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="modellmodule"
                    value={formData.modellmodule}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.4 Wechselrichtertyp:</label>
                  <select
                    className="form-select"
                    name="wrtyp"
                    value={formData.wrtyp}
                    onChange={handleChange}
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="Stringwechselrichter">Stringwechselrichter</option>
                    <option value="Zentralwechselrichter">Zentralwechselrichter</option>
                    <option value="Zentralwechselrichter">Modulwechselrichter</option>
                    <option value="Mikrowechselrichter">Mikrowechselrichter</option>
                    <option value="Hybridwechselrichter">Hybridwechselrichter</option>
                    <option value="Inselwechselrichter">Inselwechselrichter</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label>1.2.5 Hersteller WR:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="wrhersteller"
                    value={formData.wrhersteller}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.6 Modell WR:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="wrmodell"
                    value={formData.wrmodell}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.7 WR Installationsjahr:</label>
                  <input
                    type="number"
                    className="form-control"
                    name="wrinstallationsjahr"
                    value={formData.wrinstallationsjahr}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 d-flex align-items-end mb-2">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      name="wraustausch"
                      id="wraustausch"
                      checked={formData.wraustausch === "Ja"}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label"
                      htmlFor="wraustausch"
                    >
                      1.2.8 Austausch bereits erfolgt? (
                      {formData.wraustausch}
                      )
                    </label>
                  </div>
                </div>

                <div className="col-md-4">
                  <label>1.2.9 Installationsart:</label>
                  <select
                    className="form-select"
                    name="installationsart"
                    value={formData.installationsart}
                    onChange={handleChange}
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="Schrägdach">Schrägdach</option>
                    <option value="Flachdach">Flachdach</option>
                    <option value="Freifläche">Freifläche</option>
                    <option value="Carport">Carport</option>
                    <option value="Fassade">Fassade</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label>
                    1.2.10 Dachneigung / Modulneigung (°):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="dachneigung"
                    value={formData.dachneigung}
                    onChange={handleChange}
                    placeholder="z.B. 30"
                  />
                </div>

                <div className="col-md-6">
                  <label className="d-flex align-items-center gap-2">
                    1.2.11 Ausrichtung / Azimut (°)
                    <i
                      className="bi bi-info-circle text-primary"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title={`Azimut:
                  0° / 360° = Norden
                  180° = Süden
                  90° = Osten
                  270° = Westen`}
                      style={{ cursor: "pointer" }}
                    ></i>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="azimut"
                    value={formData.azimut}
                    onChange={handleChange}
                    placeholder="z.B. 180"
                  />
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ====================================================== */}
        {/* 1.3 Standortdaten */}
        {/* ====================================================== */}

        <div className="accordion-item">

          <h2 className="accordion-header" id="headingLocation">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseLocation"
              aria-expanded="false"
              aria-controls="collapseLocation"
            >
              1.3. Standortdaten (Falls unbekannt, mit PVGIS unten ermitteln)
            </button>
          </h2>

          <div
            id="collapseLocation"
            className="accordion-collapse collapse"
            aria-labelledby="headingLocation"
            data-bs-parent="#anlagenAccordion"
          >
            <div className="accordion-body">

              <div className="row g-2">

                <div className="col-md-6">
                  <label>
                    1.3.1 Breitengrad z.B. 48.1374 (München)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    name="breitengrad"
                    value={formData.breitengrad}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label>
                    1.3.2 Längengrad z.B. 11.5755 (München)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    name="langengrad"
                    value={formData.langengrad}
                    onChange={handleChange}
                  />
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ====================================================== */}
        {/* 1.4 Zustand & Wartung */}
        {/* ====================================================== */}

        <div className="accordion-item">

          <h2 className="accordion-header" id="headingMaintenance">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseMaintenance"
              aria-expanded="false"
              aria-controls="collapseMaintenance"
            >
              1.4. Zustand & Wartung
            </button>
          </h2>

          <div
            id="collapseMaintenance"
            className="accordion-collapse collapse"
            aria-labelledby="headingMaintenance"
            data-bs-parent="#anlagenAccordion"
          >
            <div className="accordion-body">

              <div className="row g-2">

                <div className="col-md-4">
                  <label>1.4.1 Zustand:</label>
                  <select
                    className="form-select"
                    name="zustand"
                    value={formData.zustand}
                    onChange={handleChange}
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="Sehr gut">Sehr gut</option>
                    <option value="Gut">Gut</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Schlecht">Schlecht</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label>1.4.2 Letzte Wartung:</label>
                  <input
                    type="month"
                    className="form-control"
                    name="letztewartung"
                    value={formData.letztewartung}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 d-flex align-items-end mb-2">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      name="wartungsvertrag"
                      id="wartungsvertrag"
                      checked={formData.wartungsvertrag === "Ja"}
                      onChange={handleChange}
                    />

                    <label
                      className="form-check-label"
                      htmlFor="wartungsvertrag"
                    >
                      1.4.3 Wartungsvertrag? (
                      {formData.wartungsvertrag}
                      )
                    </label>
                  </div>
                </div>

                <div className="col-md-12">
                  <label>1.4.4 Bekannte Probleme:</label>
                  <textarea
                    className="form-control"
                    name="probleme"
                    rows="3"
                    value={formData.probleme}
                    onChange={handleChange}
                  ></textarea>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default AnlagenDaten;