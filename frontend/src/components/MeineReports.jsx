import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert, Card } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


const MeineReports = () => {

    const { user } = useAuth();

    const navigate = useNavigate();

    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");



    useEffect(() => {


        if (!user || !user.email) {

            setLoading(false);

            return;

        }



        const loadReports = async () => {


            try {


                const backendURL =
                    import.meta.env.VITE_BACKEND_URL;



                if (!backendURL) {

                    throw new Error(
                        "Backend URL nicht konfiguriert"
                    );

                }



                const email = encodeURIComponent(
                    user.email
                );



                const response = await fetch(
                    `${backendURL}/reports/${email}`
                );



                if (!response.ok) {

                    throw new Error(
                        "Fehler beim Laden der Reports"
                    );

                }



                const data = await response.json();



                console.log(
                    "REPORTS:",
                    data
                );



                setReports(data);



            } catch (err) {


                console.error(
                    "Reports Fehler:",
                    err
                );



                setError(
                    "Reports konnten nicht geladen werden."
                );



            } finally {


                setLoading(false);


            }


        };



        loadReports();



    }, [user]);





    if (loading) {


        return (

            <div className="text-center mt-5">


                <Spinner animation="border" />


                <p className="mt-3">

                    Reports werden geladen...

                </p>


            </div>

        );


    }





    if (error) {


        return (

            <Alert variant="danger">

                {error}

            </Alert>

        );


    }





    return (


        <Card className="shadow-sm mt-4">


            <Card.Body>


                <Card.Title className="mb-4">

                    📄 Meine Reports

                </Card.Title>

                <div className="mb-3">

                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate("/")}
                    >
                        <i className="bi bi-arrow-left"></i>
                        {" "}
                        Zurück zum Hauptmenü
                    </button>

                </div>



                {
                    reports.length === 0 ? (


                        <Alert variant="info">


                            Noch keine Wertgutachten erstellt.


                        </Alert>



                    ) : (



                        <Table
                            striped
                            bordered
                            hover
                            responsive
                        >



                            <thead>


                                <tr>


                                    <th>

                                        Datum

                                    </th>



                                    <th>

                                        Anlage

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



                                {

                                    reports.map(
                                        (report) => (


                                            <tr
                                                key={report.id}
                                            >



                                                <td>


                                                    {
                                                        new Date(
                                                            report.created_at
                                                        ).toLocaleDateString(
                                                            "de-DE"
                                                        )
                                                    }


                                                </td>





                                                <td>


                                                    {
                                                        report.anlagenname ||
                                                        "-"
                                                    }


                                                </td>





                                                <td>


                                                    {
                                                        report.kwp
                                                        ?
                                                        `${report.kwp} kWp`
                                                        :
                                                        "-"
                                                    }


                                                </td>





                                                <td>


                                                    {
                                                        report.report_type ||
                                                        "-"
                                                    }


                                                </td>





                                                <td>



                                                    {

                                                        report.filename
                                                        ?

                                                        <a
                                                            href={
                                                                `${import.meta.env.VITE_BACKEND_URL}/reports/download/${report.id}`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >


                                                            <i className="bi bi-file-earmark-pdf"></i>

                                                            {" "}

                                                            PDF öffnen


                                                        </a>


                                                        :

                                                        "-"

                                                    }



                                                </td>





                                            </tr>


                                        )

                                    )

                                }



                            </tbody>




                        </Table>


                    )

                }



            </Card.Body>


        </Card>


    );


};



export default MeineReports;