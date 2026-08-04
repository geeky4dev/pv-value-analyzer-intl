import React from "react";
import { useReports } from "../context/ReportsContext";


function Reports() {


    const {
        reports,
        loadingReports
    } = useReports();



    if (loadingReports) {

        return (

            <div className="container mt-5 text-center">


                <div 
                    className="spinner-border" 
                    role="status"
                >

                    <span className="visually-hidden">
                        Loading...
                    </span>

                </div>


                <p className="mt-3">
                    Loading reports...
                </p>


            </div>

        );

    }




    return (

        <div className="container mt-5">



            {/* Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">


                <div>

                    <h2>
                        Meine Reports
                    </h2>

                </div>




                {/* Startseite Button */}

                <a

                    href="/"

                    className="btn btn-primary text-white"

                >

                    <i className="bi bi-arrow-left me-2 text-white"></i>


                    <span className="text-white">
                        Startseite
                    </span>


                </a>



            </div>





            {reports.length === 0 ? (


                <div className="alert alert-info">

                    Noch keine Reports vorhanden.

                </div>


            ) : (


                <div className="table-responsive">


                    <table className="table table-striped table-hover">


                        <thead>


                            <tr>


                                <th>
                                    Datum
                                </th>


                                <th>
                                    Anlagenname
                                </th>


                                <th>
                                    kWp
                                </th>


                                <th>
                                    Report Typ
                                </th>


                                <th>
                                    Datei
                                </th>


                            </tr>


                        </thead>





                        <tbody>


                            {reports.map((report) => (


                                <tr key={report.id}>


                                    <td>

                                        {new Date(
                                            report.created_at
                                        ).toLocaleDateString(
                                            "de-DE"
                                        )}

                                    </td>




                                    <td>
                                        {report.anlagenname || "-"}
                                    </td>




                                    <td>
                                        {report.kwp || "-"}
                                    </td>




                                    <td>
                                        {report.report_type || "-"}
                                    </td>




                                    <td>


                                        {report.filename ? (


                                            <button
                                                className="btn btn-sm btn-primary"
                                            >

                                                Download PDF

                                            </button>


                                        ) : (


                                            "-"


                                        )}



                                    </td>



                                </tr>


                            ))}



                        </tbody>


                    </table>


                </div>


            )}



        </div>


    );


}


export default Reports;