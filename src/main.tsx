import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import App from "./App";
import "@fontsource-variable/outfit";
import "@fontsource-variable/anuphan";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
