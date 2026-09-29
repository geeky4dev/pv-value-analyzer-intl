import React, { useEffect, useState } from "react";
import axios from "axios";
import PVGISMap from "./PVGISMap";

function PVGISForm({ BASE_URL, pvgisData, onChange }) {
  const [lat, setLat] = useState(pvgisData.latitude || "");
  const [lon, setLon] = useState(pvgisData.longitude || "");
  const [kwp, setKwp] = useState(pvgisData.anlagengroesse || "");
  const [production, setProduction] = useState(null);
  const [spezErtrag, setSpezErtrag] = useState(null);

  // ------------------------------------------------------------
  // Synchronize local values with the global PVGIS data
  // ------------------------------------------------------------
  useEffect(() => {
    if (onChange) {
      onChange({
        latitude: lat,
        longitude: lon,
        anlagengroesse: kwp,
      });
    }
  }, [lat, lon, kwp]);

  // ------------------------------------------------------------
  // Update system size when it changes in the global data
  // ------------------------------------------------------------
  useEffect(() => {
    if (pvgisData?.anlagengroesse) {
      setKwp(pvgisData.anlagengroesse);
    }
  }, [pvgisData?.anlagengroesse]);

  // ------------------------------------------------------------
  // Calculate PVGIS production
  // ------------------------------------------------------------
  const handlePVGIS = async () => {
    const la = parseFloat(lat);
    const lo = parseFloat(lon);
    const k = parseFloat(kwp);

    if (isNaN(la) || isNaN(lo) || isNaN(k) || k <= 0) {
      alert("Please enter valid values.");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/pvgis`, {
        lat: la,
        lon: lo,
        kwp: k,

        // Keep PVGIS losses at 0.
        // The Performance Ratio (PR) entered by the user
        // is considered later in Ertragswert.jsx.
        loss: 0,
      });

      const prod = response.data.annual_production;

      setProduction(prod);

      const se = prod / k;
      setSpezErtrag(se);

      if (onChange) {
        onChange({
          latitude: la,
          longitude: lo,
          anlagengroesse: k,
          production: prod,
          spezifischer_ertrag: se,
        });
      }
    } catch (error) {
      console.error(error);
      alert("Error while requesting PVGIS data.");
    }
  };

  // ------------------------------------------------------------
  // Handle map click
  // ------------------------------------------------------------
  const handleMapClick = (clickedLat, clickedLon) => {
    setLat(clickedLat.toFixed(5));
    setLon(clickedLon.toFixed(5));
  };

  return (
    <div className="card mb-4 p-3">

      {/* ========================================================
          SECTION HEADER
      ======================================================== */}
      <h4 className="mb-2 text-primary fw-bold">
        5. Solar Resource Analysis{" "}
        <span className="badge bg-info align-middle">OPTIONAL</span>
      </h4>

      <p className="text-muted">
        Calculate estimated annual PV production and specific yield
        based on the selected location.
      </p>

      <hr />

      {/* ========================================================
          LOCATION SELECTION
      ======================================================== */}
      <h5 className="mb-3">
        Select Location or Enter Coordinates
      </h5>

      <PVGISMap
        lat={lat}
        lon={lon}
        onClick={handleMapClick}
      />

      {/* ========================================================
          LATITUDE
      ======================================================== */}
      <div className="mb-3 mt-3">
        <label className="form-label">
          Latitude
        </label>

        <input
          type="number"
          step="any"
          className="form-control"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="e.g. 48.1374"
        />
      </div>

      {/* ========================================================
          LONGITUDE
      ======================================================== */}
      <div className="mb-3">
        <label className="form-label">
          Longitude
        </label>

        <input
          type="number"
          step="any"
          className="form-control"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="e.g. 11.5755"
        />

        <div className="form-text">
          Coordinates can be entered manually or selected directly
          on the map.
        </div>
      </div>

      <hr />

      {/* ========================================================
          SYSTEM SIZE
      ======================================================== */}
      <div className="mb-3">
        <label className="form-label">
          System Size (kWp)
        </label>

        <input
          type="number"
          step="any"
          className="form-control"
          value={kwp}
          onChange={(e) => setKwp(e.target.value)}
          placeholder="e.g. 10"
        />

        <div className="form-text">
          Automatically taken from the System Information section.
        </div>
      </div>

      {/* ========================================================
          CALCULATE BUTTON
      ======================================================== */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={handlePVGIS}
      >
        Calculate PVGIS
      </button>

      {/* ========================================================
          PVGIS RESULTS
      ======================================================== */}
      {production != null && (
        <div className="alert alert-success mt-4">

          <h5 className="mb-3">
            PVGIS Results
          </h5>

          <div>
            <strong>Annual Production:</strong>{" "}
            {production.toFixed(0)} kWh/year
          </div>

          {spezErtrag != null && (
            <div>
              <strong>Specific Yield:</strong>{" "}
              {spezErtrag.toFixed(0)} kWh/kWp/year
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default PVGISForm;