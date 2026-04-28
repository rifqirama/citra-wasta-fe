import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { WastraContextProvider } from "./context/WastraContextProvider";
import { I18nProvider } from "./context/I18nContext";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      <I18nProvider>
        <WastraContextProvider>
          <App />
        </WastraContextProvider>
      </I18nProvider>
    </StrictMode>
  </BrowserRouter>
);