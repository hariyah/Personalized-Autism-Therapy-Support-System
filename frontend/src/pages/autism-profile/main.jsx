// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Inter', sans-serif",
              borderRadius: "12px",
              fontSize: "0.9rem"
            },
            success: { iconTheme: { primary: "#16a34a", secondary: "white" } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
