import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";


function ReportForm({
  buchwertData,
  ertragswertData,
  restwertData,
  anlagenData,
  pvgisData,
  finanzData
}) {

  // =====================================================
  // AUTHENTICATED USER (SUPABASE AUTH)
  // =====================================================

  const { user } = useAuth();
  const { loadCredits } = useCredits();

  console.log("AUTH USER:", user);


  // =====================================================
  // VALUATION PROFESSIONAL DATA
  // =====================================================

  const [name, setName] = useState("");
  const [firma, setFirma] = useState("");
  const [adresse, setAdresse] = useState("");
  const [plzOrt, setPlzOrt] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);

  const [loading, setLoading] = useState(false);


  // =====================================================
  // CLIENT DATA
  // =====================================================

  const [kundeName, setKundeName] = useState("");
  const [kundeAdresse, setKundeAdresse] = useState("");
  const [kundePlzOrt, setKundePlzOrt] = useState("");
  const [kundeTelefon, setKundeTelefon] = useState("");
  const [kundeEmail, setKundeEmail] = useState("");


  // =====================================================
  // DOCUMENT ID
  // =====================================================

  const [documentId, setDocumentId] = useState("");


  // =====================================================
  // BACKEND URL
  // =====================================================

  const API_URL = import.meta.env.VITE_BACKEND_URL;


  // =====================================================
  // LOGO
  // =====================================================

  const handleLogo = (e) => {

    const file = e.target.files[0];

    if (file) {

      const reader = new FileReader();

      reader.onloadend = () => {
        setLogo(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };


  // =====================================================
  // SIGNATURE
  // =====================================================

  const handleSignature = (e) => {

    const file = e.target.files[0];

    if (file) {

      const reader = new FileReader();

      reader.onloadend = () => {
        setSignature(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };


  // =====================================================
  // CREATE PDF
  // =====================================================

  const handlePDF = async () => {

    try {

      setLoading(true);


      // =====================================================
      // PERFORMANCE RATIO
      // =====================================================

      const prValue = Number(
        ertragswertData?.performance_ratio ??
        ertragswertData?.performanceratio
      );


      // =====================================================
      // PDF DATA
      // =====================================================

      const pdfData = {

        document_id: documentId,


        // =====================================================
        // AUTHENTICATED USER / CREDIT SYSTEM
        // =====================================================

        user_id: user?.id || "",

        user_email: user?.email || "",

        user_name:
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          "",

        company:
          user?.user_metadata?.company ||
          "",


        // =====================================================
        // VALUATION PROFESSIONAL
        // =====================================================

        sachverstaendiger: {

          name: name,

          firma: firma,

          adresse: adresse,

          plz_ort: plzOrt,

          phone: phone,

          email: email,

          website: website,

          logo: logo,

          signature: signature

        },


        // =====================================================
        // CLIENT
        // =====================================================

        auftraggeber: {

          name: kundeName,

          adresse: kundeAdresse,

          plz_ort: kundePlzOrt,

          telefon: kundeTelefon,

          email: kundeEmail

        },


        // =====================================================
        // SYSTEM DATA
        // =====================================================

        anlagendaten: {

          ...(anlagenData || {}),

          adresse:
            anlagenData?.adresse || "",

          firma:
            anlagenData?.name || name,

          kwp:
            anlagenData?.kwp ||
            anlagenData?.leistung ||
            pvgisData?.anlagengroesse ||
            "",

          ort:
            anlagenData?.ort ||
            "",

          bundesland:
            anlagenData?.bundesland ||
            "",

          breitengrad:
            anlagenData?.breitengrad ||
            pvgisData?.latitude ||
            "",

          langengrad:
            anlagenData?.langengrad ||
            pvgisData?.longitude ||
            "",

          modulHersteller:
            anlagenData?.modulHersteller ||
            "",

          modulModell:
            anlagenData?.modulModell ||
            "",

          wechselrichterhersteller:
            anlagenData?.wrhersteller ||
            "",

          wechselrichtermodell:
            anlagenData?.wrmodell ||
            "",

          wechselrichtertyp:
            anlagenData?.wrtyp ||
            "",

          letzteWartung:
            anlagenData?.letzteWartung ||
            "",

          wartungsvertrag:
            anlagenData?.wartungsvertrag ||
            "Nein",

          bekannteProbleme:
            anlagenData?.bekannteProbleme ||
            ""

        },


        // =====================================================
        // DEPRECIATED ASSET VALUE
        // =====================================================

        buchwertData:
          buchwertData || {},


        // =====================================================
        // PV ECONOMIC VALUE
        // =====================================================

        ertragswertData: {

          betriebsmodell:
            ertragswertData?.betriebsmodell ||
            "",

          anlagengroesse:
            ertragswertData?.anlagengroesse ||
            0,

          spezifischer_ertrag:
            ertragswertData?.spezifischer_ertrag ??
            pvgisData?.spezifischer_ertrag ??
            0,

          strompreis:
            ertragswertData?.strompreis ??
            0,

          eigenverbrauch_anteil:
            ertragswertData?.eigenverbrauch_anteil ||
            0,

          netzeinspeisung:
            ertragswertData?.netzeinspeisung ||
            0,

          batterie_verluste:
            ertragswertData?.batterie_verluste ||
            0,

          einspeiseverguetung:
            ertragswertData?.einspeiseverguetung ||
            0,

          restlaufzeit:
            ertragswertData?.restlaufzeit ||
            0,

          performance_ratio:
            !isNaN(prValue)
              ? prValue
              : 80,

          degradation:
            ertragswertData?.degradation ||
            ertragswertData?.degradacion_anual ||
            0,

          opex:
            ertragswertData?.opex ||
            ertragswertData?.opex_anual ||
            0,

          ertragswertKumuliert:
            ertragswertData?.ertragswertKumuliert ||
            0,

          jahresertrag:
            ertragswertData?.jahresertrag ||
            ertragswertData?.jahresertragBrutto ||
            0,

          production:
            pvgisData?.production ||
            ertragswertData?.production ||
            0,

          diskontsatz:
            finanzData?.discount_rate ||
            0,

          zeithorizont:
            finanzData?.horizon ||
            0,

          npv:
            finanzData?.npv ||
            0,

          irr:
            finanzData?.irr ||
            0,

          payback:
            finanzData?.payback ||
            ertragswertData?.payback ||
            0,

          cashflows:
            finanzData?.cashflows ||
            []

        },


        // =====================================================
        // RESIDUAL VALUE
        // =====================================================

        restwertData: {

          kostenabschlag:
            restwertData?.kostenabschlag ||
            0,

          verkaufsabschlag:
            restwertData?.verkaufsabschlag ||
            0,

          wartung:
            restwertData?.wartung
              ? "Yes"
              : "No",

          zustand:
            restwertData?.zustand ||
            "-",

          performanceratio:
            restwertData?.pr ||
            0,

          restlaufzeit:
            restwertData?.restlaufzeit ||
            "-",

          marktfaktor:
            restwertData?.marktfaktor ||
            0,

          zukuenftige_gewinne:
            Number(
              restwertData?.zukuenftige_gewinne
            ) || 0,

          restwert:
            restwertData?.restwert ||
            0

        }

      };


      // =====================================================
      // DEBUG
      // =====================================================

      console.log(
        "PDF user email:",
        pdfData.user_email
      );

      console.log(
        "FINAL PDF DATA:",
        pdfData
      );

      console.log(
        "VALUATION PROFESSIONAL:",
        pdfData.sachverstaendiger
      );

      console.log(
        "CLIENT:",
        pdfData.auftraggeber
      );


      // =====================================================
      // VERIFY USER
      // =====================================================

      if (
        !pdfData.user_id ||
        !pdfData.user_email
      ) {

        throw new Error(
          "Invalid Supabase user. Please sign in again."
        );

      }


      // =====================================================
      // SEND PDF TO BACKEND
      // =====================================================

      const res = await fetch(
        `${API_URL}/pdf`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(pdfData)

        }
      );


      // =====================================================
      // HTTP ERROR
      // =====================================================

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}: ${res.statusText}`
        );

      }


      // =====================================================
      // DOWNLOAD PDF
      // =====================================================

      const blob =
        await res.blob();

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        "PV-Valuation-Report_PRO.pdf";

      a.click();

      URL.revokeObjectURL(url);


      // =====================================================
      // UPDATE CREDITS
      // =====================================================

      await loadCredits();

    }


    catch (err) {

      console.error(err);


      if (
        err.message.includes("402")
      ) {

        alert(
          "No credits available. Please purchase credits to create a new PV valuation report."
        );

      }


      else {

        alert(
          `PDF Error: ${err.message}. Please try again.`
        );

      }

    }


    finally {

      setLoading(false);

    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <>

      <div className="card mb-4 p-3">

        <h4 className="text-primary fw-bold">
          8. Professional PV Valuation Report
        </h4>



        {/* =====================================================
            VALUATION PROFESSIONAL
        ===================================================== */}

        <h6 className="mt-3">
          Analyst / Valuation Professional
        </h6>


        <form>


          {/* NAME */}

          <div className="mb-2">

            <label>
              Name:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Smith"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>


          {/* COMPANY */}

          <div className="mb-2">

            <label>
              Company:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. Solar Energy LLC"
              value={firma}
              onChange={(e) =>
                setFirma(e.target.value)
              }
            />

          </div>


          {/* ADDRESS */}

          <div className="mb-2">

            <label>
              Address:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. 123 Solar Street"
              value={adresse}
              onChange={(e) =>
                setAdresse(e.target.value)
              }
            />

          </div>


          {/* POSTAL CODE / CITY */}

          <div className="mb-2">

            <label>
              Postal Code / City:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. 12345 New York"
              value={plzOrt}
              onChange={(e) =>
                setPlzOrt(e.target.value)
              }
            />

          </div>


          {/* PHONE */}

          <div className="mb-2">

            <label>
              Phone:
            </label>

            <input
              type="tel"
              className="form-control"
              placeholder="e.g. +1 555 123 4567"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

          </div>


          {/* EMAIL */}

          <div className="mb-2">

            <label>
              Email:
            </label>

            <input
              type="email"
              className="form-control"
              placeholder="e.g. info@solarexample.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>


          {/* WEBSITE */}

          <div className="mb-2">

            <label>
              Website:
            </label>

            <input
              type="url"
              className="form-control"
              placeholder="e.g. www.solarexample.com"
              value={website}
              onChange={(e) =>
                setWebsite(e.target.value)
              }
            />

          </div>


          {/* =====================================================
              LOGO
          ===================================================== */}

          <div className="mb-3">

            <label className="fw-bold">
              Company Logo:
            </label>

            <input
              type="file"
              className="form-control"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogo}
            />

            <div className="form-text text-muted">

              <strong>
                PNG, JPEG or SVG
              </strong>{" "}
              (recommended for best quality)

            </div>


            {logo && (

              <div
                className="mt-2 p-2 border bg-light text-center"
                style={{
                  borderRadius: "8px"
                }}
              >

                <img
                  src={logo}
                  alt="Logo Preview"
                  style={{
                    maxHeight: "60px",
                    maxWidth: "150px",
                    objectFit: "contain"
                  }}
                />

              </div>

            )}

          </div>


          {/* =====================================================
              SIGNATURE
          ===================================================== */}

          <div className="mb-4">

            <label className="fw-bold">
              Digital Signature (Valuation Professional):
            </label>

            <input
              type="file"
              className="form-control"
              accept=".jpg,.jpeg,.png"
              onChange={handleSignature}
            />

            <div className="form-text text-muted">

              <strong>
                PNG or JPEG
              </strong>{" "}
              (PNG transparency recommended)

            </div>


            {signature && (

              <div
                className="mt-2 p-2 border bg-light text-center"
                style={{
                  borderRadius: "8px"
                }}
              >

                <p className="small text-muted mb-1">
                  Signature Preview:
                </p>

                <img
                  src={signature}
                  alt="Signature Preview"
                  style={{
                    maxHeight: "80px",
                    maxWidth: "200px",
                    objectFit: "contain"
                  }}
                />

              </div>

            )}

          </div>


          {/* =====================================================
              CLIENT
          ===================================================== */}

          <h5 className="mt-4">
            Client
          </h5>


          {/* NAME */}

          <div className="mb-2">

            <label>
              Client Name:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. Jane Smith"
              value={kundeName}
              onChange={(e) =>
                setKundeName(e.target.value)
              }
            />

          </div>


          {/* ADDRESS */}

          <div className="mb-2">

            <label>
              Client Address:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. 25 Solar Avenue"
              value={kundeAdresse}
              onChange={(e) =>
                setKundeAdresse(e.target.value)
              }
            />

          </div>


          {/* POSTAL CODE / CITY */}

          <div className="mb-2">

            <label>
              Postal Code / City:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="e.g. 10001 New York"
              value={kundePlzOrt}
              onChange={(e) =>
                setKundePlzOrt(e.target.value)
              }
            />

          </div>


          {/* PHONE */}

          <div className="mb-2">

            <label>
              Phone:
            </label>

            <input
              type="tel"
              className="form-control"
              placeholder="e.g. +1 555 987 6543"
              value={kundeTelefon}
              onChange={(e) =>
                setKundeTelefon(e.target.value)
              }
            />

          </div>


          {/* EMAIL */}

          <div className="mb-2">

            <label>
              Email:
            </label>

            <input
              type="email"
              className="form-control"
              placeholder="e.g. client@email.com"
              value={kundeEmail}
              onChange={(e) =>
                setKundeEmail(e.target.value)
              }
            />

          </div>


          {/* =====================================================
              DOCUMENT ID
          ===================================================== */}

          <div className="mb-2">

            <label className="fw-bold">
              Document ID:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Internal reference number (e.g. PV-2026-001)"
              value={documentId}
              onChange={(e) =>
                setDocumentId(e.target.value)
              }
            />

          </div>


          {/* =====================================================
              PDF BUTTON
          ===================================================== */}

          <button
            type="button"
            className="btn btn-success mt-2"
            onClick={handlePDF}
            disabled={loading}
          >

            {loading
              ? "Generating PDF..."
              : "Create PDF Report"}

          </button>


        </form>

      </div>


      {/* =====================================================
          DEBUG INPUT DATA
      ===================================================== */}

      {/*
      <div className="card mb-4 p-3">

        <h5>
          DEBUG INPUT DATA
        </h5>

        <pre>
          {JSON.stringify(
            {
              ertragswertData,
              restwertData,
              pvgisData,
              finanzData
            },
            null,
            2
          )}
        </pre>

      </div>
      */}

    </>

  );

}


export default ReportForm;