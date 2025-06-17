const { ipcRenderer } = window.electron || {};
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import { Calendar, Settings, ChevronDown, User, Wallet, OctagonAlert, Loader } from "lucide-react";
import Logo from "@/assets/images/logo-white-2.png";
import Permission from "./permission";
import { useSocket } from "@/context/socket-context";
import { Button } from "./ui/button";

const Navbar = ({ username }) => {
    const socket = useSocket();
    const navigate = useNavigate();
    const [needUpdate, setNeedUpdate] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        const checkForUpdates = async () => {
            const result = await ipcRenderer.invoke('check-for-updates');
            setNeedUpdate(result.updateAvailable);
        }

        checkForUpdates();
    }, []);


    const onLogout = () => {
        localStorage.removeItem("user");
        socket && socket.disconnect();
        navigate("/login");
    };

    return (
        <nav className="navbar fixed w-full top-0 left-0 z-50 bg-orange-600 text-white shadow-sm py-4">
            <div className="px-7 flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center space-x-10">
                    <img
                        src={Logo}
                        alt="MonRDV Logo"
                        className="h-8 w-auto"
                    />

                    {/* Menu Items */}
                    <ul className="flex items-center space-x-6">
                        <Permission name="patients_list">
                            <li className="flex items-center space-x-2">
                                <NavLink
                                    to="/patients"
                                    className="flex items-center space-x-2"
                                >
                                    <User size={20} />
                                    <span>Accueil patients</span>
                                    <DropdownMenuShortcut>F2</DropdownMenuShortcut>
                                </NavLink>
                            </li>
                            <div className="w-px h-10 bg-white opacity-30"></div>
                        </Permission>
                        <Permission name="appointments_list">
                            <li className="flex items-center space-x-2">
                                <NavLink
                                    to="/"
                                    className="flex items-center space-x-2"
                                >
                                    <Calendar size={20} />
                                    <span>Calendrier des séances</span>
                                    <DropdownMenuShortcut>F1</DropdownMenuShortcut>
                                </NavLink>
                            </li>
                            <div className="w-px h-10 bg-white opacity-30"></div>
                        </Permission>
                        <Permission name="payments">
                            <li className="flex items-center space-x-2">
                                <NavLink
                                    to="/cash-register"
                                    className="flex items-center space-x-2"
                                >
                                    <Wallet size={20} />
                                    <span>Facturation</span>
                                    <DropdownMenuShortcut>F3</DropdownMenuShortcut>
                                </NavLink>
                            </li>
                            <div className="w-px h-10 bg-white opacity-30"></div>
                        </Permission>
                        <li className="flex items-center space-x-2">
                            <NavLink
                                to="/settings"
                                className="flex items-center space-x-2"
                            >
                                <Settings size={20} />
                                <span>Paramètres</span>
                                <DropdownMenuShortcut>F4</DropdownMenuShortcut>
                            </NavLink>
                        </li>
                    </ul>
                </div>

                {/* User Section */}
                <div className="flex items-center space-x-4">
                    {needUpdate && (
                        <Button variant="ghost" size="sm" onClick={async () => {
                            setUpdateLoading(true);
                            const result = await ipcRenderer.invoke('download-update');
                            if (result.error) {
                                setUpdateLoading(false);
                                alert("Une erreur est survenue lors du téléchargement de la mise à jour.");
                            }
                        }}>
                            {
                                updateLoading ?
                                <Loader className="animate-spin" size={18} />
                                :
                                <OctagonAlert size={18}/>
                            }
                            <span>Mettre à jour</span>
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center space-x-3 focus:outline-none">
                                {/* User Initials */}
                                <div className="bg-orange-100 h-9 w-9 flex items-center justify-center rounded-full text-gray-800 font-bold uppercase">
                                    {username.charAt(0)}
                                </div>
                                <span className="font-medium">{username}</span>
                                <ChevronDown size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="bg-white text-gray-800 rounded-md shadow-lg"
                        >
                            <DropdownMenuItem>
                                <NavLink to="/profile" className="block w-full text-left">
                                    Mon profil
                                </NavLink>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <button
                                    onClick={onLogout}
                                    className="block w-full text-left"
                                >
                                    Déconnexion
                                </button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
