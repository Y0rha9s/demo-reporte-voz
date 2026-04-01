import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reportes from "./pages/Reportes";
import NuevoReporte from "./pages/NuevoReporte";
import Layout from "./components/Layout";

function RutaProtegida({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }>
            <Route index element={<Dashboard />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="reportes/nuevo" element={<NuevoReporte />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;