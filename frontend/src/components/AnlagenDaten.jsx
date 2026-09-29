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
      <h4 className="border-bottom pb-2 text-primary fw-bold">1. System Information</h4>

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
              1.1. General Information
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
                  <label>1.1.1 Address:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="123 Solar Street"
                  />
                </div>

                <div className="col-md-4">
                  <label>1.1.2 ZIP / Postal Code:</label>
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
                  <label>1.1.3 City:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ort"
                    value={formData.ort}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </div>

                <div className="col-md-4">
                  <label>1.1.4 State / Region:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="bundesland"
                    value={formData.bundesland}
                    onChange={handleChange}
                    placeholder="State or region"
                  />
                </div>

                <div className="col-md-12">
                  <label>1.1.5 Company:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firma"
                    value={formData.firma}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.6 Email:</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@company.com"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.7 Phone:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleChange}
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.8 System Size (kWp):</label>
                  <input
                    type="number"
                    className="form-control"
                    name="leistung"
                    value={formData.leistung}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                  />
                </div>

                <div className="col-md-6">
                  <label>1.1.9 Installation Date:</label>
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
              1.2. Technical Details
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
                  <label>1.2.1 Module Type:</label>

                  <select
                    className="form-select"
                    name="modultyp"
                    value={formData.modultyp}
                    onChange={handleChange}
                  >
                    <option value="">Please select</option>

                    <option value="Monokristallin">
                      Monocrystalline
                    </option>

                    <option value="Polykristallin">
                      Polycrystalline
                    </option>

                    <option value="Dünnschicht">
                      Thin-film
                    </option>

                    <option value="Bifazial">
                      Bifacial
                    </option>

                  </select>
                </div>

                <div className="col-md-4">
                  <label>1.2.2 Module Manufacturer:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="modulhersteller"
                    value={formData.modulhersteller}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.3 Module Model:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="modellmodule"
                    value={formData.modellmodule}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.4 Inverter Type:</label>
                  <select
                    className="form-select"
                    name="wrtyp"
                    value={formData.wrtyp}
                    onChange={handleChange}
                  >
                    <option value="">Please select</option>

                    <option value="Stringwechselrichter">
                      String Inverter
                    </option>

                    <option value="Zentralwechselrichter">
                      Central Inverter
                    </option>

                    <option value="Modulwechselrichter">
                      Module Inverter
                    </option>

                    <option value="Mikrowechselrichter">
                      Microinverter
                    </option>

                    <option value="Hybridwechselrichter">
                      Hybrid Inverter
                    </option>

                    <option value="Inselwechselrichter">
                      Off-grid Inverter
                    </option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label>1.2.5 Inverter Manufacturer:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="wrhersteller"
                    value={formData.wrhersteller}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.6 Inverter Model:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="wrmodell"
                    value={formData.wrmodell}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label>1.2.7 Inverter Installation Year:</label>
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
                      1.2.8 Has the inverter already been replaced? (
                      {formData.wraustausch === "Ja" ? "Yes" : "No"}
                      )
                    </label>
                  </div>
                </div>

                <div className="col-md-4">
                  <label>1.2.9 Installation Type:</label>
                  <select
                    className="form-select"
                    name="installationsart"
                    value={formData.installationsart}
                    onChange={handleChange}
                  >
                    <option value="">Please select</option>
                    <option value="Schrägdach">Pitched Roof</option>
                    <option value="Flachdach">Flat Roof</option>
                    <option value="Freifläche">Ground-mounted</option>
                    <option value="Carport">Carport</option>
                    <option value="Fassade">Facade</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label>
                    1.2.10 Roof / Module Tilt (°):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="dachneigung"
                    value={formData.dachneigung}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="col-md-6">
                  <label className="d-flex align-items-center gap-2">
                    1.2.11 Orientation / Azimuth (°)
                    <i
                      className="bi bi-info-circle text-primary"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title={`Azimuth:
                    0° / 360° = North
                    180° = South
                    90° = East
                    270° = West`}
                      style={{ cursor: "pointer" }}
                    ></i>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="azimut"
                    value={formData.azimut}
                    onChange={handleChange}
                    placeholder="e.g. 180"
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
              1.3. Location Data (If unknown, use the PVGIS tool below)
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
                    1.3.1 Latitude (e.g. 40.7128)
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
                    1.3.2 Longitude (e.g. -74.0060)
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
              1.4. Condition & Maintenance
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
                  <label>1.4.1 System Condition:</label>
                  <select
                    className="form-select"
                    name="zustand"
                    value={formData.zustand}
                    onChange={handleChange}
                  >
                    <option value="">Please select</option>
                    <option value="Sehr gut">Very Good</option>
                    <option value="Gut">Good</option>
                    <option value="Mittel">Average</option>
                    <option value="Schlecht">Poor</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label>1.4.2 Last Maintenance:</label>
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
                      1.4.3 Maintenance Contract? (
                      {formData.wartungsvertrag === "Ja" ? "Yes" : "No"}
                      )
                    </label>
                  </div>
                </div>

                <div className="col-md-12">
                  <label>1.4.4 Known Issues:</label>
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