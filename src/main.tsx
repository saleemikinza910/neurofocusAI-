import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent annoying Vite development WebSocket disconnect errors from bubbling up or showing overlays
if (typeof window !== "undefined") {
  const isBenignError = (err: any): boolean => {
    if (!err) return false;
    const str = [
      typeof err === "string" ? err : "",
      err.message || "",
      err.reason || "",
      err.stack || "",
      err.name || "",
      typeof err.toString === "function" ? err.toString() : ""
    ].join(" ").toLowerCase();

    return (
      str.includes("websocket") ||
      str.includes("web socket") ||
      str.includes("vite") ||
      str.includes("hmr") ||
      str.includes("closed without opened") ||
      str.includes("connection") ||
      str.includes("sockjs")
    );
  };

  // Capture phase to intercept first and call stopImmediatePropagation()
  window.addEventListener("unhandledrejection", (event) => {
    if (isBenignError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener("error", (event) => {
    if (isBenignError(event.message) || isBenignError(event.error) || isBenignError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Preserve console.error but stifle the benign errors
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const isBenign = args.some(arg => isBenignError(arg));
    if (isBenign) {
      return; // Swallowed silently to prevent annoying console messages and overlay triggers
    }
    originalConsoleError.apply(this, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
