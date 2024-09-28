import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.tsx";
import AuthProvider from "./context/auth.context.tsx";
import { Toaster } from "sonner";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Toaster position="bottom-right" richColors />
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </StrictMode>
);
