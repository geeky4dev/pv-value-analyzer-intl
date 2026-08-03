
import React from "react";


function Credits() {


    return (

        <div className="container mt-4">


            <h3>
                💳 Credits kaufen
            </h3>


            <p className="text-muted">
                Wählen Sie Ihr Credit-Paket.
            </p>


            <div className="row mt-4">


                <div className="col-md-4">

                    <div className="card shadow">

                        <div className="card-body">

                            <h5>
                                Starter
                            </h5>

                            <p>
                                10 Credits
                            </p>

                            <button className="btn btn-primary">
                                Kaufen
                            </button>

                        </div>

                    </div>

                </div>



                <div className="col-md-4">

                    <div className="card shadow">

                        <div className="card-body">

                            <h5>
                                Professional
                            </h5>

                            <p>
                                25 Credits
                            </p>

                            <button className="btn btn-primary">
                                Kaufen
                            </button>

                        </div>

                    </div>

                </div>



                <div className="col-md-4">

                    <div className="card shadow">

                        <div className="card-body">

                            <h5>
                                Expert
                            </h5>

                            <p>
                                50 Credits
                            </p>

                            <button className="btn btn-primary">
                                Kaufen
                            </button>

                        </div>

                    </div>

                </div>


            </div>


        </div>

    );


}


export default Credits;

