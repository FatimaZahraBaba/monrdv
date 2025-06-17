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
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableRow from "@/components/sortable-row";


const TabMutuals = () => {
    const [mutuals, setMutuals] = useState([]);
    const [mutualDialogOpen, setMutualDialogOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        fetchMutuals();
    }, []);

    const fetchMutuals = async () => {
        const resp = await axios.get("/mutuals");
        setMutuals(resp);
    };

    const openMutualDialog = (item = { name: "" }) => {
        setSelectedData(item);
        setMutualDialogOpen(true);
    };

    const handleMutualSubmit = async (data) => {
        if (data.id) {
            await axios.put(`/mutuals/${data.id}`, data);
        } else {
            await axios.post("/mutuals", data);
        }
        setMutualDialogOpen(false);
        fetchMutuals();
    };

    const openDeleteDialog = (id, type) => {
        setDeleteTarget({ id, type });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTarget) {
            await axios.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
            fetchMutuals();
        }
        setDeleteDialogOpen(false);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = mutuals.findIndex(item => item.id === active.id);
            const newIndex = mutuals.findIndex(item => item.id === over.id);
            const orderedMutuals = arrayMove(mutuals, oldIndex, newIndex);
            setMutuals(orderedMutuals);
            await axios.put("/mutuals/reorder", {
                mutuals: orderedMutuals.map((m => m.id))
            });
        }
    }

    return (
        <>
            <TabsContent value="mutuals">
                <Card>
                    <CardContent className="py-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">Liste des mutuelles</h2>
                            <Permission name="mutuals_create">
                                <Button onClick={() => openMutualDialog()}><Plus size={16} className="mr-1" /> Ajouter</Button>
                            </Permission>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={mutuals.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead></TableHead>
                                            <TableHead>Nom</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mutuals.map((mutual) => (
                                            <SortableRow key={mutual.id} id={mutual.id}>
                                                <TableCell className="py-3">{mutual.name}</TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex space-x-2">
                                                        <Permission name="mutuals_edit">
                                                            <Button size="sm" variant="outline" onClick={() => openMutualDialog(mutual)}><Edit size={16} /></Button>
                                                        </Permission>
                                                        <Permission name="mutuals_delete">
                                                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(mutual.id, "mutuals")}><Trash2 size={16} /></Button>
                                                        </Permission>
                                                    </div>
                                                </TableCell>
                                            </SortableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </SortableContext>
                        </DndContext>
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

            <MutualDialog open={mutualDialogOpen} onClose={() => setMutualDialogOpen(false)} onSubmit={handleMutualSubmit} initialData={selectedData} />
        </>
    );
};

export default TabMutuals;

const MutualDialog = ({ open, onClose, onSubmit, initialData }) => {
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
                    <DialogTitle>{formData.id ? "Modifier" : "Ajouter"} une mutuelle</DialogTitle>
                </DialogHeader>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nom de la mutuelle" />
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
