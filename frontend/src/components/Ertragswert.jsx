import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { FinancialContext } from "./FinancialContext.jsx";

function Ertragswert({
  onResult,
  betriebsmodell,
  pvgisProduction,
  anlagengroesse,
  restlaufzeit
}) {

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



  // ======================================================
  // HILFSFUNKTIONEN
  // ======================================================

  const parseEuroFloat = (val) => {

    if (typeof val === "number") return val;

    return parseFloat(
      String(val).replace(",", ".")
    );

  };


  const formatEuro = (valor) => {

    if (
      valor === null ||
      valor === undefined ||
      isNaN(valor)
    ) {
      return "0,00";
    }


    return parseFloat(valor).toLocaleString(
      "de-DE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

  };


  const formatPercent = (valor) => {

    const num = parseEuroFloat(valor);

    if (isNaN(num)) return "0,00";


    return num.toLocaleString(
      "de-DE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

  };



  // ======================================================
  // DIREKTVERMARKTUNG EEG
  // >100 kWp Volleinspeisung
  // ======================================================

  const isDirektvermarktung =
    parseEuroFloat(kwp) > 100;



  // ======================================================
  // TARIFDATEN EEG
  // ======================================================

  const tarifsData = useMemo(() => {


    const size =
      parseEuroFloat(kwp) || 0;


    const evAnteil =
      parseEuroFloat(eigenverbrauchAnteil) || 0;


    const isVolleinspeisung =
      betriebsmodell === "volleinspeisung" ||
      evAnteil === 0;



    const getTarifSet = (
      v10,
      vOther,
      e10,
      e40,
      eOther,
      m10,
      m40,
      m100,
      mOther
    ) => ({


      volleinspeisung:
        size <= 10
          ? v10
          : size <= 100
            ? vOther
            : null,


      eigenverbrauch:

        isVolleinspeisung

          ? (
              size <= 10
                ? v10
                : size <= 100
                    ? vOther
                    : null
            )

          :

            (
              size <= 10
                ? e10
                : size <= 40
                    ? e40
                    : eOther
            ),



      mieterstrom:

        size <= 10
          ? m10
          : size <= 40
              ? m40
              : size <= 100
                  ? m100
                  : mOther

    });



    return {


      h1:

      getTarifSet(
        12.34,
        10.35,

        7.78,
        6.73,
        5.50,

        2.56,
        2.38,
        2.38,
        1.60
      ),



      h2:

      getTarifSet(
        12.22,
        10.25,

        7.70,
        6.66,
        5.45,

        2.51,
        2.35,
        2.35,
        1.58
      ),



      h3:

      getTarifSet(
        12.09,
        10.14,

        7.63,
        6.60,
        5.39,

        2.49,
        2.33,
        2.33,
        1.56
      ),


      isVolleinspeisung,

      size

    };


  }, [
    kwp,
    eigenverbrauchAnteil,
    betriebsmodell
  ]);




  // ======================================================
  // AUTOMATISCHE EEG VERGÜTUNG
  // ======================================================

  useEffect(() => {


    const now = new Date();


    let period = "h1";
    let periodName = "Feb-Jul 2026";



    if (now >= new Date("2027-02-01")) {

      period = "h3";
      periodName = "2027+";

    }

    else if (now >= new Date("2026-08-01")) {

      period = "h2";
      periodName = "Aug 2026-Jan 2027";

    }



    setEegPeriod(periodName);



    let modelKey = betriebsmodell;



    if (
      betriebsmodell &&
      betriebsmodell
        .toLowerCase()
        .includes("eigenverbrauch")
    ) {

      modelKey = "eigenverbrauch";

    }



    // Más de 100 kWp:
    // No existe EEG fija

    if (isDirektvermarktung) {


      setAutoVerguetung(null);

      setVerguetung("0");


      return;

    }



    const autoValue =
      tarifsData[period][modelKey] || 8.50;



    setAutoVerguetung(autoValue);


    setVerguetung(
      autoValue
        .toFixed(2)
        .replace(".", ",")
    );



  }, [
    betriebsmodell,
    tarifsData,
    isDirektvermarktung
  ]);




  useEffect(() => {


    if (restlaufzeit !== undefined) {

      setRestlaufzeitState(
        String(restlaufzeit)
      );

    }


  }, [restlaufzeit]);

    // ======================================================
  // CALCULAR ERTRAGSWERT
  // ======================================================

  const calculateErtragswert = async () => {


    if (isDirektvermarktung) {

      alert(
        "PV-Anlagen über 100 kWp werden über Direktvermarktung nach EEG (Marktprämienmodell) vermarktet. Es gibt keine feste EEG-Einspeisevergütung."
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



    if (
      [
        k,
        seInput,
        v,
        rl,
        prVal,
        degr,
        opexVal
      ].some(isNaN)
    ) {

      alert(
        "Bitte gültige Zahlen eingeben!"
      );

      return;

    }



    let ea =
      parseEuroFloat(eigenverbrauchAnteil);



    ea =
      ea > 1
        ? ea / 100
        : ea;



    if (
      betriebsmodell === "mieterstrom" ||
      betriebsmodell === "volleinspeisung"
    ) {

      ea = 0;

    }



    const pvProduction =
      pvgisProduction?.annual_production ||
      (k * seInput);



    const se =
      pvProduction && k > 0
        ? pvProduction / k
        : seInput;



    const vergütungEuro =
      v / 100;



    const strompreisEuro =
      parseEuroFloat(strompreis);



    const mieterstromZuschlagEuro =
      parseEuroFloat(mieterstromZuschlag);



    let jahresBrutto;



    if (
      betriebsmodell === "mieterstrom"
    ) {


      const ma =
        parseEuroFloat(mieterstromAnteil) > 1

          ? parseEuroFloat(mieterstromAnteil) / 100

          : parseEuroFloat(mieterstromAnteil);



      jahresBrutto =
        pvProduction *
        (prVal / 100) *
        (
          ma *
          (
            strompreisEuro +
            mieterstromZuschlagEuro
          )

          +

          (1 - ma) *
          vergütungEuro
        );



    } else {


      jahresBrutto =
        k *
        se *
        (prVal / 100) *
        (
          ea *
          strompreisEuro

          +

          (1 - ea) *
          vergütungEuro
        );


    }




    let ertragsKumuliert = 0;
    let npv = 0;

    const discountRate = 0.05;


    let currentJahrProd =
      jahresBrutto;



    for (
      let i = 1;
      i <= rl;
      i++
    ) {


      const netCashflow =
        currentJahrProd -
        opexVal;



      ertragsKumuliert +=
        netCashflow;



      npv +=
        netCashflow /
        Math.pow(
          1 + discountRate,
          i
        );



      currentJahrProd *=
        (1 - degr / 100);


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


      jahresertragBrutto:
        jahresBrutto.toFixed(2),


      ertragswertKumuliert:
        ertragsKumuliert.toFixed(2),


      ertragswertProJahr:
        (
          ertragsKumuliert / rl
        ).toFixed(2),


      npv:
        npv.toFixed(2),


      betriebsmodell,

      eeg_period:
        eegPeriod,


      strompreis:
        strompreisEuro,


      eigenverbrauch_anteil:
        ea

    };



    setJahresertragBrutto(
      res.jahresertragBrutto
    );


    setErtragswertKumuliert(
      res.ertragswertKumuliert
    );


    setErtragswertProJahr(
      res.ertragswertProJahr
    );


    setNpvState(
      res.npv
    );



    if (onResult) {

      onResult(res);

    }



    try {


      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ertragswert`,
        res
      );


    } catch(error) {


      console.error(
        "Error Ertragswert:",
        error
      );


    }


  };





  return (

    <div className="card mb-4 p-3">


      <h4 className="text-primary fw-bold">
        4. Ertragswert berechnen
      </h4>




      <div className="row">


        <div className="col-md-6 mb-2">

          <label>
            Anlagengröße (kWp):
          </label>


          <input
            type="text"
            className="form-control"
            value={kwp}
            readOnly
          />


          <div className="form-text">
            Automatisch aus den Anlagendaten übernommen
          </div>


        </div>





        <div className="col-md-6 mb-2">


          <label>
            Spezifischer Ertrag (kWh/kWp):
          </label>


          <input
            type="text"
            className="form-control"
            value={spezErtrag}
            onChange={
              e => setSpezErtrag(e.target.value)
            }
          />



          {pvgisProduction?.production != null && (

            <small className="text-primary">

              PVGIS:
              {
                formatEuro(
                  pvgisProduction.production
                )
              }
              kWh/a

            </small>

          )}


        </div>


      </div>





      <div className="alert alert-success mt-3">


        <div className="row align-items-center">



          <div className="col-md-4">

            <strong>
              📊 Modell:
            </strong>

            <br />

            <span className="badge bg-success fs-6">

              {
                betriebsmodell.toUpperCase()
              }

            </span>


          </div>





          <div className="col-md-4">


            {

              isDirektvermarktung ?


              <>

                <strong>
                  ⚡ Vermarktung:
                </strong>

                <br />

                <span className="badge bg-info fs-6">

                  Direktvermarktung

                </span>


              </>


              :

              <>

                <strong>
                  ⚡ AUTO-Vergütung:
                </strong>

                <br />

                <span className="badge bg-warning fs-6">

                  {
                    formatEuro(autoVerguetung)
                  }
                  ct/kWh

                </span>


              </>


            }


          </div>





          <div className="col-md-4">


            <strong>
              📅 EEG-Periode:
            </strong>


            <br />


            <span className="badge bg-primary fs-6">

              {
                eegPeriod
              }

            </span>


          </div>



        </div>


      </div>





      <div className="row mt-3">


        <div className="col-md-6">

          <label>
            Restlaufzeit (Jahre):
          </label>


          <input
            className="form-control"
            value={restlaufzeitState}
            onChange={
              e => setRestlaufzeitState(e.target.value)
            }
          />

        </div>


      </div>





      <button
        className="btn btn-primary btn-lg w-100 mt-4"
        onClick={calculateErtragswert}
      >

        💰 Ertragswert berechnen

      </button>





      {jahresertragBrutto !== null && (


        <div className="alert alert-success mt-4">


          <h5>
            Ergebnis
          </h5>



          <p>
            📈 Jährlicher Ertrag:
            <strong>
              {" "}
              {formatEuro(jahresertragBrutto)}
              €
            </strong>
          </p>



          <p>
            📊 Ertragswert/Jahr:
            <strong>
              {" "}
              {formatEuro(ertragswertProJahr)}
              €
            </strong>
          </p>



          <p>
            💰 Kumuliert:
            <strong>
              {" "}
              {formatEuro(ertragswertKumuliert)}
              €
            </strong>
          </p>



          <p>
            📉 NPV:
            <strong>
              {" "}
              {formatEuro(npvState)}
              €
            </strong>
          </p>



        </div>


      )}



    </div>

  );


}



export default Ertragswert;