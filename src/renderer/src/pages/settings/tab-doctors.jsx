import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Permission from "@/components/permission";
import Dropdown from "@/components/dropdown";
import { Label } from "@/components/ui/label";
import { capitaliseWords, formatPhone } from "@/functions";

const TabDoctors = () => {
    const [activeTab, setActiveTab] = useState("doctors");
    const [doctors, setDoctors] = useState([]);
    const [specialities, setSpecialities] = useState([]);
    const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
    const [specialityDialogOpen, setSpecialityDialogOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchDoctors();
        fetchSpecialities();
    }, []);

    const fetchDoctors = async () => {
        const resp = await axios.get("/doctors");
        setDoctors(resp);
    };

    const fetchSpecialities = async () => {
        const resp = await axios.get("/specialities");
        setSpecialities(resp);
    };

    const openDoctorDialog = (item = { name: "" }) => {
        setSelectedData(item);
        setDoctorDialogOpen(true);
    };

    const openSpecialityDialog = (item = { name: "" }) => {
        setSelectedData(item);
        setSpecialityDialogOpen(true);
    };

    const handleDoctorSubmit = async (data) => {
        if (data.id) {
            await axios.put(`/doctors/${data.id}`, data);
        } else {
            await axios.post("/doctors", data);
        }
        setDoctorDialogOpen(false);
        fetchDoctors();
        fetchSpecialities();
    };

    const handleSpecialitySubmit = async (data) => {
        if (data.id) {
            await axios.put(`/specialities/${data.id}`, data);
        } else {
            await axios.post("/specialities", data);
        }
        setSpecialityDialogOpen(false);
        fetchSpecialities();
        fetchDoctors();
    };

    const openDeleteDialog = (id, type) => {
        setDeleteTarget({ id, type });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTarget) {
            await axios.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
            fetchDoctors();
        }
        deleteTarget.type === "doctors" ? fetchDoctors() : fetchSpecialities();
    };

    return (
        <>
            <TabsContent value="doctors">
                <Card>
                    <CardContent className="py-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 mt-0">
                            <TabsList>
                                <TabsTrigger value="doctors">
                                    Liste des docteurs
                                </TabsTrigger>
                                <TabsTrigger value="specialities">
                                    Liste des spécialités
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="doctors">
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-xl font-bold">Liste des docteurs</h2>
                                    <Permission name="doctors_create">
                                        <Button onClick={() => openDoctorDialog()}><Plus size={16} className="mr-1" /> Ajouter</Button>
                                    </Permission>
                                </div>
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Spécialité</TableHead>
                                            <TableHead>RDV</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {doctors.map((doctor) => (
                                            <TableRow key={doctor.id}>
                                                <TableCell className="py-3 text-nowrap font-semibold">{doctor.name}</TableCell>
                                                <TableCell className="py-3">
                                                    <span className="line-clamp-1">{doctor.speciality}</span>
                                                </TableCell>
                                                <TableCell className="py-3">{doctor.appointments_count}</TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex space-x-2">
                                                        <Permission name="doctors_edit">
                                                            <Button size="sm" variant="outline" onClick={() => openDoctorDialog(doctor)}><Edit size={16} /></Button>
                                                        </Permission>
                                                        <Permission name="doctors_delete">
                                                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(doctor.id, "doctors")}><Trash2 size={16} /></Button>
                                                        </Permission>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="specialities">
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-xl font-bold">Liste des spécialités</h2>
                                    <Permission name="doctors_create">
                                        <Button onClick={() => openSpecialityDialog()}><Plus size={16} className="mr-1" /> Ajouter</Button>
                                    </Permission>
                                </div>
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Doc</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {specialities.map((doctor) => (
                                            <TableRow key={doctor.id}>
                                                <TableCell className="py-3 font-semibold">
                                                    <span className="line-clamp-1">{doctor.name}</span>
                                                </TableCell>
                                                <TableCell className="py-3">{doctor.doctors_count}</TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex space-x-2">
                                                        <Permission name="doctors_edit">
                                                            <Button size="sm" variant="outline" onClick={() => openSpecialityDialog(doctor)}><Edit size={16} /></Button>
                                                        </Permission>
                                                        <Permission name="doctors_delete">
                                                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(doctor.id, "specialities")}><Trash2 size={16} /></Button>
                                                        </Permission>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
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

            <DoctorDialog open={doctorDialogOpen} onClose={() => setDoctorDialogOpen(false)} onSubmit={handleDoctorSubmit} initialData={selectedData} specialities={specialities} />
            <SpcialityDialog open={specialityDialogOpen} onClose={() => setSpecialityDialogOpen(false)} onSubmit={handleSpecialitySubmit} initialData={selectedData} />
        </>
    );
};

export default TabDoctors;

const DoctorDialog = ({ open, onClose, onSubmit, initialData, specialities }) => {
    const [formData, setFormData] = useState({ id: null, name: "", speciality_id: null, address: "", phone: "" });

    useEffect(() => {
        setFormData({ id: null, name: "", speciality_id: null, address: "", phone: "", ...initialData });
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formData.id ? "Modifier" : "Ajouter"} un docteur</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div>
                        <Label>Nom du médecin</Label>
                        <Input
                            name="name"
                            value={formData.name}
                            onBlur={(e) => setFormData({ ...formData, name: capitaliseWords(e.target.value) })}
                            onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Spécialité</Label>
                        <Dropdown placeholder="Sélectionnez une spécialité" name="speciality_id" value={formData.speciality_id} options={specialities} onChange={handleChange} clearable />
                    </div>
                    <div>
                        <Label>Adresse</Label>
                        <Input name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div>
                        <Label>Téléphone</Label>
                        <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={() => setFormData({ ...formData, phone: formatPhone(formData.phone) })}/>
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

const SpcialityDialog = ({ open, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ id: null, name: "" });

    useEffect(() => {
        setFormData({ id: null, name: "", ...initialData });
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formData.id ? "Modifier" : "Ajouter"} une spécialité</DialogTitle>
                </DialogHeader>

                <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={(e) => setFormData({ ...formData, name: capitaliseWords(e.target.value) })}
                    placeholder="Nom de la spécialité" />

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