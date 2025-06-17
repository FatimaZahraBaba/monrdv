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
import Permission from "@/components/permission";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BooleanIcon from "@/components/BooleanIcon";

const TabPrices = () => {
    const [prices, setPrices] = useState([]);
    const [priceDialogOpen, setPriceDialogOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        const resp = await axios.get("/prices");
        setPrices(resp);
    };

    const openPriceDialog = (item = { price: "" }) => {
        setSelectedData(item);
        setPriceDialogOpen(true);
    };

    const handlePriceSubmit = async (data) => {
        if (data.id) {
            await axios.put(`/prices/${data.id}`, data);
        } else {
            await axios.post("/prices", data);
        }
        setPriceDialogOpen(false);
        fetchPrices();
    };

    const openDeleteDialog = (id, type) => {
        setDeleteTarget({ id, type });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTarget) {
            await axios.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
            fetchPrices();
        }
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <TabsContent value="prices">
                <Card>
                    <CardContent className="py-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">Liste des prix</h2>
                            <Permission name="prices_create">
                                <Button onClick={() => openPriceDialog()}><Plus size={16} className="mr-1" /> Ajouter</Button>
                            </Permission>
                        </div>
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead>Prix</TableHead>
                                    <TableHead>RDV</TableHead>
                                    <TableHead>Par défaut</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prices.map((price) => (
                                    <TableRow key={price.id}>
                                        <TableCell className="py-3 font-semibold">{price.price} DH</TableCell>
                                        <TableCell className="py-3">{price.appointments_count}</TableCell>
                                        <TableCell className="py-3">
                                            <BooleanIcon value={price.is_default}/>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex space-x-2">
                                                <Permission name="prices_edit">
                                                    <Button size="sm" variant="outline" onClick={() => openPriceDialog(price)}><Edit size={16} /></Button>
                                                </Permission>
                                                <Permission name="prices_delete">
                                                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(price.id, "prices")}><Trash2 size={16} /></Button>
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

            <PriceDialog open={priceDialogOpen} onClose={() => setPriceDialogOpen(false)} onSubmit={handlePriceSubmit} initialData={selectedData} />
        </>
    );
};

export default TabPrices;

const PriceDialog = ({ open, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ id: null, price: "" });

    useEffect(() => {
        setFormData({ id: null, price: "", ...initialData });
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formData.id ? "Modifier" : "Ajouter"} un prix</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div>
                        <Label>Montant</Label>
                        <Input name="price" type="number" value={formData.price} onChange={handleChange} />
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
