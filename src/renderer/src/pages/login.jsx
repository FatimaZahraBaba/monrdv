const { ipcRenderer } = window.electron || {};
import React, { useContext, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import Logo from "@/assets/images/logo.png";
import { useNavigate } from "react-router-dom";
import RolesContext from "@/context/roles-context";
import { Eye, EyeOff } from "lucide-react";
import { useSocket } from "@/context/socket-context";

const LoginPage = ({ setUsername }) => {
    const socket = useSocket();
    const navigate = useNavigate();
    const { fetchRoles } = useContext(RolesContext);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [appVersion, setAppVersion] = useState("");

    useEffect(() => {
        const fetchAppVersion = async () => {
            const version = await ipcRenderer.invoke("get-app-version");
            setAppVersion(version);
        };

        fetchAppVersion();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await axios.post("/login", formData);
            localStorage.setItem("user", JSON.stringify(user));
            setUsername(user.username);
            fetchRoles();

            if (socket) {
                socket.auth = { token: user.token };
                socket.connect();
            }

            if (user.is_admin || user.roles.appointments_list)
                navigate("/");
            else if (user.roles.patients_list)
                navigate("/patients");
            else
                navigate("/settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center">
            <img
                src={Logo}
                alt="MonRDV Logo"
                className="login-logo mb-14 mx-auto"
            />

            <Card className="w-full max-w-[410px] p-10 px-[55px] rounded-xl">
                <CardContent className="p-0">
                    <h2 className="text-3xl font-semibold mb-4">Bienvenue dans votre espace MonRDV.</h2>
                    <p className="mb-8">Accédez à vos outils de gestion en podologie en toute sécurité.</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Identifiant professionnel"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mot de passe sécurisé"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                        <Button size="lg" className="w-full" disabled={loading}>Se connecter</Button>
                    </form>
                </CardContent>
            </Card>

            <span className="text-sm text-gray-500 mt-4">Version : {appVersion}</span>
        </div>
    );
};

export default LoginPage;
