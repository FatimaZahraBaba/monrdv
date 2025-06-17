import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import Toolbar from "@/components/toolbar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const ProfilePage = ({ setUsername }) => {
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        roles: {}
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            setFormData({
                ...formData,
                ...user
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const resp = await axios.put(`/users/${formData.id}`, formData);
            localStorage.setItem("user", JSON.stringify(formData));
            setUsername(formData.username);

            toast({
                title: "Opération réussie",
                description: resp.message
            })
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto w-full space-y-4">
            <Toolbar title="Mon profil" />

            <Card>
                <CardContent className="py-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Nom d'utilisateur</Label>
                                <Input disabled={!formData.is_admin} name="username" value={formData.username} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>Mot de passe</Label>
                                <div className="relative">
                                    <Input name="password" value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} />
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
                        </div>

                        <div className="flex justify-end">
                            <Button disabled={loading}>Valider les changements</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
