import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CreditsProvider } from "./context/CreditsContext";
import { ReportsProvider } from "./context/ReportsContext";
import { BrowserRouter } from "react-router-dom";

// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";

// Bootstrap JS
import "bootstrap/dist/js/bootstrap.bundle.min";

// Bootstrap Icons
import "bootstrap-icons/font/bootstrap-icons.css";

import "./index.css";

// Crear raíz y renderizar App
ReactDOM.createRoot(document.getElementById("root")).render(

  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <CreditsProvider>

          <ReportsProvider>

            <App />

          </ReportsProvider>

        </CreditsProvider>

      </AuthProvider>

    </BrowserRouter>

  </React.StrictMode>

);

