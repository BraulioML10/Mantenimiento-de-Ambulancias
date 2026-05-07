import { createRoot } from "react-dom/client"
import App from "./app/App.tsx"
import { AmbulanceProvider } from "./app/AmbulanceContext"
import "./styles/index.css"

createRoot(document.getElementById("root")!).render(
  <AmbulanceProvider>
    <App />
  </AmbulanceProvider>
)