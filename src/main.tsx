import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCapacitor } from "@/lib/capacitor-init";

// Initialize Capacitor plugins (StatusBar, etc.)
initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
