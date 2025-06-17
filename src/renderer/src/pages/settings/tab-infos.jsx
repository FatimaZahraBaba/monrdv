import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";
import Permission from "@/components/permission";
import { formatPhone } from "@/functions";

function TabInfos() {
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        address_header: "",
        address_footer: "",
        patente: "",
        rc: "",
        cnss: "",
        ice: "",
        if: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInfos();
    }, []);

    const fetchInfos = async () => {
        const resp = await axios.get("/settings");
        setFormData(resp);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const resp = await axios.put("/settings", formData);
            toast({
                title: "Opération réussie",
                description: resp.message
            });
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <TabsContent value="infos">
            <Card>
                <CardContent className="py-6">
                    <div className="flex justify-between mb-4">
                        <h2 className="text-xl font-bold">Informations générales</h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Email</Label>
                                <Input name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>Tél/Fax</Label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={() => setFormData({ ...formData, phone: formatPhone(formData.phone) })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Adresse haut de page</Label>
                                <Textarea name="address_header" value={formData.address_header} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>Adresse bas de page</Label>
                                <Textarea name="address_footer" value={formData.address_footer} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-6">
                            <div>
                                <Label>Patente</Label>
                                <Input name="patente" value={formData.patente} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>RC</Label>
                                <Input name="rc" value={formData.rc} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>CNSS</Label>
                                <Input name="cnss" value={formData.cnss} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>ICE</Label>
                                <Input name="ice" value={formData.ice} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>IF</Label>
                                <Input name="if" value={formData.if} onChange={handleChange} />
                            </div>
                        </div>

                        <Permission name="settings">
                            <div className="flex justify-end">
                                <Button disabled={loading}>Valider les changements</Button>
                            </div>
                        </Permission>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>
    )
}

export default TabInfos