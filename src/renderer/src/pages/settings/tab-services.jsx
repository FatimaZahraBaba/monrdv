import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Permission from "@/components/permission";
import BooleanIcon from "@/components/BooleanIcon";
import { capitaliseWords } from "@/functions";


const TabServices = () => {
    const [services, setServices] = useState([]);
    const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        const resp = await axios.get("/services");
        setServices(resp);
    };

    const openServiceDialog = (item = { name: "" }) => {
        setSelectedData(item);
        setServiceDialogOpen(true);
    };

    const handleServiceSubmit = async (data) => {
        if (data.id) {
            await axios.put(`/services/${data.id}`, data);
        } else {
            await axios.post("/services", data);
        }
        setServiceDialogOpen(false);
        fetchServices();
    };

    const openDeleteDialog = (id, type) => {
        setDeleteTarget({ id, type });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTarget) {
            await axios.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
            fetchServices();
        }
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <TabsContent value="services">
                <Card>
                    <CardContent className="py-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">Liste des types de prestations</h2>
                            <Permission name="services_create">
                                <Button onClick={() => openServiceDialog()}><Plus size={16} className="mr-1" /> Ajouter</Button>
                            </Permission>
                        </div>
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>RDV</TableHead>
                                    <TableHead>Facturable</TableHead>
                                    <TableHead>Par défaut</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="py-3 font-semibold">{service.name}</TableCell>
                                        <TableCell className="py-3">{service.appointments_count}</TableCell>
                                        <TableCell className="py-3">
                                            <BooleanIcon value={service.billable}/>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <BooleanIcon value={service.is_default}/>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex space-x-2">
                                                <Permission name="services_edit">
                                                    <Button size="sm" variant="outline" onClick={() => openServiceDialog(service)}><Edit size={16} /></Button>
                                                </Permission>
                                                <Permission name="services_delete">
                                                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(service.id, "services")}><Trash2 size={16} /></Button>
                                                </Permission>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cet élément ?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ServiceDialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} onSubmit={handleServiceSubmit} initialData={selectedData} />
        </>
    );
};

export default TabServices;

const ServiceDialog = ({ open, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ id: null, name: "", billable: false, is_default: false });

    useEffect(() => {
        setFormData({ id: null, name: "", billable: false, is_default: false, ...initialData });
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formData.id ? "Modifier" : "Ajouter"} une prestation</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                    <div>
                        <Label>Nom</Label>
                        <Input
                            name="name"
                            value={formData.name}
                            onBlur={(e) => setFormData({ ...formData, name: capitaliseWords(e.target.value) })}
                            onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Facturable</Label>
                        <Switch checked={formData.billable} onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })} />
                    </div>
                    <div>
                        <Label>Valeur sélectionnée par défaut</Label>
                        <Switch checked={formData.is_default} onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button onClick={() => onSubmit(formData)}>{formData.id ? "Mettre à jour" : "Ajouter"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};