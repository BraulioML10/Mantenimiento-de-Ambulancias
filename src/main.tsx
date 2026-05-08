import { createRoot } from "react-dom/client"
import App from "./app/App.tsx"
import { AmbulanceProvider } from "./app/AmbulanceContext"
import { AuthProvider } from "./app/AuthContext"
import "./styles/index.css"

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <AmbulanceProvider>
      <App />
    </AmbulanceProvider>
  </AuthProvider>
)