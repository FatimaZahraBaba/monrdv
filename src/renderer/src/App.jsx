const { ipcRenderer } = window.electron || {};
import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/navbar";
import { useToast } from "./components/hooks/use-toast";
import axios from "axios";
import { Toaster } from "./components/ui/toaster";
import AppointmentsCalendarPage from "./pages/appointments-calendar";
import AppointmentsPage from "./pages/appointments";
import PatientsPage from "./pages/patients";
import CashRegister from "./pages/cash-rejister";
import SettingsPage from "./pages/settings";
import LoginPage from "./pages/login";
import ProfilePage from "./pages/profile";
import RolesContext from "./context/roles-context";
import { useSocket } from "./context/socket-context";

const App = () => {
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast()
  const { checkRole, fetchRoles } = useContext(RolesContext);

  const [username, setUsername] = useState("");

  const isAppointmentsPage = location.pathname === "/appointments" || location.pathname === "/";
  const isLoginPage = location.pathname === "/login";
  
  useEffect(() => {
    axios.interceptors.response.use(null, error => {
      if (!error.response)
        return Promise.reject(error);

      const { status, data } = error.response;
      if (status != 401 && status != 403) {
        toast({
          variant: "destructive",
          title: "Une erreur est survenue!",
          description: data.error
        })
      }

      return Promise.reject(error);
    })

    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUsername(user.username);
    }
    
    document.addEventListener("keyup", (e) => {  
      if ((e.key === "F1" || e.key == "Escape") && checkRole("appointments_list"))
        navigate("/");
      else if (e.key === "F2" && checkRole("patients_list"))
        navigate("/patients");
      else if (e.key === "F3" && checkRole("payments"))
        navigate("/cash-register");
      else if (e.key === "F4")
        navigate("/settings");
    });

    ipcRenderer.on("app-before-quit", async () => {
      socket && socket.disconnect();
      localStorage.removeItem("user");
    });

    return () => {
      document.removeEventListener("keyup", () => {});
    }
  }, [])

  return (
    <div>
      {
        !isLoginPage && <Navbar username={username} />
      }
      <Toaster />

      <main className={`${isAppointmentsPage ? '' : ''} ${isLoginPage ? '' : 'pt-[100px]'} mx-auto px-6 ptb pb-6 flex flex-col h-screen`}>
        <Routes>
          <Route path="/" element={<AppointmentsCalendarPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} /> 
          <Route path="/cash-register" element={<CashRegister/>} />
          <Route path="/settings" element={<SettingsPage/>} />
          <Route path="/login" element={<LoginPage setUsername={setUsername}/>} />
          <Route path="/profile" element={<ProfilePage setUsername={setUsername}/>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
