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
  // USUARIO AUTENTICADO (SUPABASE AUTH)
  // =====================================================

  const { user } = useAuth();
  const { loadCredits } = useCredits();

  console.log("AUTH USER:", user);

  // =====================================================
  // DATOS DEL SACHVERSTÄNDIGER
  // =====================================================

  const [name, setName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [plzOrt, setPlzOrt] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // DATOS DEL AUFTRAGGEBER
  // =====================================================

  const [kundeName, setKundeName] = useState("");
  const [kundeAdresse, setKundeAdresse] = useState("");
  const [kundePlzOrt, setKundePlzOrt] = useState("");
  const [kundeTelefon, setKundeTelefon] = useState("");
  const [kundeEmail, setKundeEmail] = useState("");

  // =====================================================
  // DOCUMENT-ID
  // =====================================================

  const [documentId, setDocumentId] = useState("");

  // =====================================================
  // URL DEL BACKEND
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
  // UNTERSCHRIFT
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
  // PDF ERSTELLEN
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
        // USUARIO AUTENTICADO / SISTEMA DE CRÉDITOS
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
        // SACHVERSTÄNDIGER
        //
        // Name
        // Adresse
        // PLZ Ort
        // Telefon
        // E-Mail
        // Website
        // =====================================================

        sachverstaendiger: {

          name: name,

          adresse: adresse,

          plz_ort: plzOrt,

          phone: phone,

          email: email,

          website: website,

          logo: logo,

          signature: signature

        },

        // =====================================================
        // AUFTRAGGEBER
        // =====================================================

        auftraggeber: {

          name: kundeName,

          adresse: kundeAdresse,

          plz_ort: kundePlzOrt,

          telefon: kundeTelefon,

          email: kundeEmail

        },

        // =====================================================
        // ANLAGENDATEN
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
        // BUCHWERT
        // =====================================================

        buchwertData:
          buchwertData || {},

        // =====================================================
        // ERTRAGSWERT
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
        // RESTWERT
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
              ? "Ja"
              : "Nein",

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
        "SACHVERSTÄNDIGER:",
        pdfData.sachverstaendiger
      );

      console.log(
        "AUFTRAGGEBER:",
        pdfData.auftraggeber
      );

      // =====================================================
      // VERIFICAR USUARIO
      // =====================================================

      if (
        !pdfData.user_id ||
        !pdfData.user_email
      ) {

        throw new Error(
          "Usuario Supabase no válido. Inicia sesión nuevamente."
        );

      }

      // =====================================================
      // ENVIAR PDF AL BACKEND
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
      // ERROR HTTP
      // =====================================================

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}: ${res.statusText}`
        );

      }

      // =====================================================
      // DESCARGAR PDF
      // =====================================================

      const blob =
        await res.blob();

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        "PV-Bewertungsbericht_PRO.pdf";

      a.click();

      URL.revokeObjectURL(url);

      // =====================================================
      // ACTUALIZAR CREDITS
      // =====================================================

      await loadCredits();

    }

    catch (err) {

      console.error(err);

      if (
        err.message.includes("402")
      ) {

        alert(
          "Keine Credits verfügbar. Bitte kaufen Sie Credits, um einen neuen PV-Bewertungsbericht zu erstellen."
        );

      }

      else {

        alert(
          `PDF Fehler: ${err.message}. Bitte versuchen Sie es erneut.`
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

        <h5>
          8. PV-Bewertungsbericht PRO
        </h5>

        {/* =====================================================
            SACHVERSTÄNDIGER
        ===================================================== */}

        <h6 className="mt-3">
          Bearbeiter / Sachverständiger
        </h6>

        <form>

          {/* NAME / FIRMA */}

          <div className="mb-2">

            <label>
              Name / Firma:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="z.B. Max Mustermann / Muster Solar GmbH"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>

          {/* ADRESSE */}

          <div className="mb-2">

            <label>
              Adresse:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Musterstraße 1"
              value={adresse}
              onChange={(e) =>
                setAdresse(e.target.value)
              }
            />

          </div>

          {/* PLZ ORT */}

          <div className="mb-2">

            <label>
              PLZ Ort:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="54321 Musterstadt"
              value={plzOrt}
              onChange={(e) =>
                setPlzOrt(e.target.value)
              }
            />

          </div>

          {/* TELEFON */}

          <div className="mb-2">

            <label>
              Telefon:
            </label>

            <input
              type="tel"
              className="form-control"
              placeholder="055 12345678"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

          </div>

          {/* E-MAIL */}

          <div className="mb-2">

            <label>
              E-Mail:
            </label>

            <input
              type="email"
              className="form-control"
              placeholder="info@mustersolar.de"
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
              placeholder="www.mustersolar.de"
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
              Firmenlogo:
            </label>

            <input
              type="file"
              className="form-control"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogo}
            />

            <div className="form-text text-muted">

              <strong>
                PNG, JPEG oder SVG
              </strong>{" "}
              (für beste Qualität)

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
                  alt="Logo Vorschau"
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
              UNTERSCHRIFT
          ===================================================== */}

          <div className="mb-4">

            <label className="fw-bold">
              Digitale Unterschrift (Sachverständiger):
            </label>

            <input
              type="file"
              className="form-control"
              accept=".jpg,.jpeg,.png"
              onChange={handleSignature}
            />

            <div className="form-text text-muted">

              <strong>
                PNG oder JPEG
              </strong>{" "}
              (PNG-Transparenz empfohlen)

            </div>

            {signature && (

              <div
                className="mt-2 p-2 border bg-light text-center"
                style={{
                  borderRadius: "8px"
                }}
              >

                <p className="small text-muted mb-1">
                  Vorschau der Unterschrift:
                </p>

                <img
                  src={signature}
                  alt="Unterschrift Vorschau"
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
              AUFTRAGGEBER
          ===================================================== */}

          <h5 className="mt-4">
            Auftraggeber
          </h5>

          {/* NAME */}

          <div className="mb-2">

            <label>
              Name des Kunden:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="z.B. Frau Erika Müller"
              value={kundeName}
              onChange={(e) =>
                setKundeName(e.target.value)
              }
            />

          </div>

          {/* ADRESSE */}

          <div className="mb-2">

            <label>
              Adresse des Kunden:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Teststraße 25"
              value={kundeAdresse}
              onChange={(e) =>
                setKundeAdresse(e.target.value)
              }
            />

          </div>

          {/* PLZ ORT */}

          <div className="mb-2">

            <label>
              PLZ Ort:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="10115 Berlin"
              value={kundePlzOrt}
              onChange={(e) =>
                setKundePlzOrt(e.target.value)
              }
            />

          </div>

          {/* TELEFON */}

          <div className="mb-2">

            <label>
              Telefon:
            </label>

            <input
              type="tel"
              className="form-control"
              placeholder="030 12345678"
              value={kundeTelefon}
              onChange={(e) =>
                setKundeTelefon(e.target.value)
              }
            />

          </div>

          {/* E-MAIL */}

          <div className="mb-2">

            <label>
              E-Mail:
            </label>

            <input
              type="email"
              className="form-control"
              placeholder="kunde@email.de"
              value={kundeEmail}
              onChange={(e) =>
                setKundeEmail(e.target.value)
              }
            />

          </div>

          {/* =====================================================
              DOKUMENT-ID
          ===================================================== */}

          <div className="mb-2">

            <label className="fw-bold">
              Dokument-ID:
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Interne Referenznummer (z. B. PV-2026-001)"
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
              ? "Generiere PDF..."
              : "PDF-Report erstellen"}

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

