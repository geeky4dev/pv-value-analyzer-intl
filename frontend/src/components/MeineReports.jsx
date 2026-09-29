import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert, Card } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const MeineReports = () => {
    const { user } = useAuth();

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
                setError("");

                const backendURL =
                    import.meta.env.VITE_BACKEND_URL;

                if (!backendURL) {
                    throw new Error(
                        "Backend URL is not configured"
                    );
                }

                const email = encodeURIComponent(user.email);

                const response = await fetch(
                    `${backendURL}/reports/${email}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Error loading reports"
                    );
                }

                const data = await response.json();

                console.log("REPORTS:", data);

                setReports(data);

            } catch (err) {
                console.error("Reports error:", err);

                setError(
                    "Could not load your reports."
                );

            } finally {
                setLoading(false);
            }
        };

        loadReports();

    }, [user]);


    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    if (loading) {
        return (
            <div className="text-center mt-5">

                <Spinner animation="border" />

                <p className="mt-3">
                    Loading reports...
                </p>

            </div>
        );
    }


    // --------------------------------------------------
    // Error
    // --------------------------------------------------

    if (error) {
        return (
            <Alert variant="danger">
                {error}
            </Alert>
        );
    }


    // --------------------------------------------------
    // Main
    // --------------------------------------------------

    return (

        <Card
            className="shadow-sm mt-4"
            style={{
                backgroundColor: "transparent",
                border: "none"
            }}
        >

            <Card.Body>

                {/* ==========================================
                    COMMON CONTENT CONTAINER
                    ========================================== */}

                <div
                    className="mx-auto"
                    style={{
                        width: "100%",
                        maxWidth: "900px"
                    }}
                >

                    {/* Title */}

                    <Card.Title className="mb-4 text-primary">

                        📄 My Reports

                    </Card.Title>


                    {/* Home button */}

                    <div className="mb-3">

                        <Link
                            to="/"
                            className="btn btn-primary text-white"
                        >

                            <i className="bi bi-arrow-left me-2 text-white"></i>

                            <span className="text-white">
                                Home
                            </span>

                        </Link>

                    </div>


                    {/* ==========================================
                        NO REPORTS
                        ========================================== */}

                    {reports.length === 0 ? (

                        <Alert variant="info">

                            No reports have been created yet.

                        </Alert>

                    ) : (

                        /* ======================================
                           REPORTS TABLE
                           ====================================== */

                        <div className="table-responsive">

                            <Table
                                striped
                                bordered
                                hover
                                className="mb-0"
                                style={{
                                    minWidth: "650px",
                                    tableLayout: "fixed"
                                }}
                            >

                                <thead>

                                    <tr>

                                        <th
                                            style={{
                                                width: "15%"
                                            }}
                                        >
                                            Date
                                        </th>


                                        <th
                                            style={{
                                                width: "25%"
                                            }}
                                        >
                                            System
                                        </th>


                                        <th
                                            style={{
                                                width: "10%"
                                            }}
                                        >
                                            kWp
                                        </th>


                                        <th
                                            style={{
                                                width: "35%"
                                            }}
                                        >
                                            Report Type
                                        </th>


                                        <th
                                            style={{
                                                width: "15%",
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            File
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {reports.map((report) => (

                                        <tr key={report.id}>

                                            {/* Date */}

                                            <td>
                                                {new Date(
                                                    report.created_at
                                                ).toLocaleDateString(
                                                    "en-US"
                                                )}
                                            </td>


                                            {/* System name */}

                                            <td>

                                                {report.anlagenname ===
                                                "PV Anlage"

                                                    ? "PV System"

                                                    : report.anlagenname ||
                                                      "-"}

                                            </td>


                                            {/* System size */}

                                            <td>

                                                {report.kwp !== null &&
                                                report.kwp !== undefined

                                                    ? `${report.kwp} kWp`

                                                    : "-"}

                                            </td>


                                            {/* Report type */}

                                            <td>

                                                {report.report_type ===
                                                "PDF_WERTGUTACHTEN"

                                                    ? "PV Valuation Report"

                                                    : report.report_type ||
                                                      "-"}

                                            </td>


                                            {/* PDF */}

                                            <td
                                                style={{
                                                    whiteSpace: "nowrap"
                                                }}
                                            >

                                                {report.filename ? (

                                                    <a
                                                        href={`${import.meta.env.VITE_BACKEND_URL}/reports/pdf/${report.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-decoration-none"
                                                    >

                                                        <i className="bi bi-file-earmark-pdf"></i>

                                                        {" "}

                                                        Open PDF

                                                    </a>

                                                ) : (

                                                    "-"

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </Table>

                        </div>

                    )}

                </div>

            </Card.Body>

        </Card>

    );

};


export default MeineReports;