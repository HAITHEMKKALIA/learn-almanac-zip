import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerAppSW } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(<App />);
registerAppSW();

