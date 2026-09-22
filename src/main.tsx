import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { App } from "./app/App";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element #root was not found in index.html");
}

if (import.meta.env.DEV) {
  document.fonts.ready.then(() => {
    const fellEnglish = document.fonts.check('400 16px "IM Fell English"');
    const cinzel = document.fonts.check('500 16px "Cinzel"');
    if (!fellEnglish) console.warn('[Font Check] IM Fell English failed to load');
    if (!cinzel) console.warn('[Font Check] Cinzel failed to load');
    if (fellEnglish && cinzel) console.log('[Font Check] All custom fonts loaded successfully');
  });
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);