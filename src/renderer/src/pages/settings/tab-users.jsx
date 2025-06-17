import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import Permission from "@/components/permission";
import RolesContext from "@/context/roles-context";
import { Checkbox } from "@/components/ui/checkbox";
import BooleanIcon from "@/components/BooleanIcon";

const TabUsers = () => {
    const { fetchRoles } = useContext(RolesContext);
    const [users, setUsers] = useState([]);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const resp = await axios.get("/users");
        setUsers(resp);
    };

    const openUserDialog = (item = {
        username: "",
        password: "",
        is_admin: false,
        active: true,
        roles: {
            appointments_list: true,
            patients_list: true,
            prices_list: true,
            doctors_list: true,
            services_list: true,
            mutuals_list: true,
        },
    }) => {
        setSelectedData(item);
        setUserDialogOpen(true);
    };

    const handleUserSubmit = async (data) => {
        if (data.id) {
            await axios.put(`/users/${data.id}`, data);
            const user = JSON.parse(localStorage.getItem("user"));
            if (user && user.id == data.id) {
                localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
                fetchRoles();
            }
        } else {
            await axios.post("/users", data);
        }
        setUserDialogOpen(false);
        fetchUsers();
    };

    const openDeleteDialog = (id, type) => {
        setDeleteTarget({ id, type });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTarget) {
            await axios.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
            fetchUsers();
        }
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <TabsContent value="users">
                <Card>
                    <CardContent className="py-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">Liste des utilisateurs</h2>
                            <Permission name="users_create">
                                <Button onClick={() => openUserDialog()}><Plus size={16} className="mr-1" /> Ajouter</Button>
                            </Permission>
                        </div>
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead>Nom d'utilisateur</TableHead>
                                    <TableHead>Actif</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="py-3">{user.username}</TableCell>
                                        <TableCell className="py-3">
                                            <BooleanIcon value={user.active}/>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex space-x-2">
                                                <Permission name="users_edit">
                                                    <Button size="sm" variant="outline" onClick={() => openUserDialog(user)}><Edit size={16} /></Button>
                                                </Permission>
                                                <Permission name="users_delete">
                                                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(user.id, "users")}><Trash2 size={16} /></Button>
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

            <UserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} onSubmit={handleUserSubmit} initialData={selectedData} />
        </>
    );
};

export default TabUsers;

const UserDialog = ({ open, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        roles: {}
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setFormData({
            id: null,
            username: "",
            password: "",
            is_admin: false,
            active: true,
            roles: {
                appointments_list: true,
                patients_list: true,
                prices_list: true,
                doctors_list: true,
                services_list: true,
                mutuals_list: true,
            },
            ...initialData
        });
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (name, checked) => {
        setFormData({
            ...formData,
            roles: {
                ...formData.roles,
                [name]: checked
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{formData.id ? "Modifier" : "Ajouter"} un utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-6">
                        <div>
                            <Label>Nom d'utilisateur</Label>
                            <Input name="username" value={formData.username} onChange={handleChange} />
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
                        <div>
                            <Label>Actif</Label>
                            <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <Label className="flex items-center text-md font-bold mb-5">
                            <span>Privilèges</span>
                            <div className="flex items-center ml-6">
                                <Label className="mb-0 mr-2">Tous les privilèges (Admin)</Label>
                                <Switch checked={formData.is_admin} onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked })} />
                            </div>
                        </Label>
                        {!formData.is_admin &&
                            <div className="space-y-2">
                                {[
                                    { label: "Gestion des rendez-vous", roles: ["appointments", "appointments_list", "appointments_create", "appointments_edit", "appointments_delete"] },
                                    { label: "Gestion des patients", roles: ["patients", "patients_list", "patients_create", "patients_edit", "patients_delete"] },
                                    { label: "Gestion des prix", roles: ["prices", "prices_list", "prices_create", "prices_edit", "prices_delete"] },
                                    { label: "Gestion des docteurs", roles: ["doctors", "doctors_list", "doctors_create", "doctors_edit", "doctors_delete"] },
                                    { label: "Gestion des services", roles: ["services", "services_list", "services_create", "services_edit", "services_delete"] },
                                    { label: "Gestion des mutuelles", roles: ["mutuals", "mutuals_list", "mutuals_create", "mutuals_edit", "mutuals_delete"] },
                                    { label: "Gestion des utilisateurs", roles: ["users", "users_list", "users_create", "users_edit", "users_delete"] },
                                ].map(({ label, roles }) => (
                                    <div key={label} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6">
                                        <div>
                                            {/* <Label className="mb-2">{label}</Label>
                                            <Switch size="small" checked={roles.slice(1).every(role => formData.roles[role])} onCheckedChange={checked => {
                                                let formRoles = { ...formData.roles };
                                                roles.forEach(role => formRoles[role] = checked);
                                                setFormData({ ...formData, roles: formRoles });
                                            }} /> */}
                                            <Label className="flex items-center space-x-2">
                                                <Checkbox checked={roles.slice(1).every(role => formData.roles[role])} onCheckedChange={checked => {
                                                    let formRoles = { ...formData.roles };
                                                    roles.forEach(role => formRoles[role] = checked);
                                                    setFormData({ ...formData, roles: formRoles });
                                                }} />
                                                <span className={roles.slice(1).every(role => formData.roles[role]) ? 'text-dark' : 'text-gray-500'}>{label}</span>
                                            </Label>
                                        </div>
                                        {roles.slice(1).map((role, index) => (
                                            <Label key={role} className="flex items-center space-x-2">
                                                <Checkbox checked={formData.roles[role]} onCheckedChange={checked => handleRoleChange(role, checked)} />
                                                <span className={formData.roles[role] ? 'text-dark' : 'text-gray-500'}>
                                                    {
                                                        index === 0 ? "Consulter" :
                                                            index === 1 ? "Ajouter" :
                                                                index === 2 ? "Modifier" :
                                                                    index === 3 ? "Supprimer" : ""
                                                    }
                                                </span>
                                            </Label>
                                        ))}
                                    </div>
                                ))}
                                <div className="flex flex-wrap">
                                    <Label className="flex items-center space-x-2 mr-4 mb-5">
                                        <Checkbox checked={formData.roles.appointments_status_edit} onCheckedChange={checked => handleRoleChange("appointments_status_edit", checked)} />
                                        <span className={formData.roles.appointments_status_edit ? 'text-dark' : 'text-gray-500'}>Modifier les statuts dans le RDV</span>
                                    </Label>
                                    <Label className="flex items-center space-x-2 mr-4 mb-5">
                                        <Checkbox checked={formData.roles.appointments_payment_edit} onCheckedChange={checked => handleRoleChange("appointments_payment_edit", checked)} />
                                        <span className={formData.roles.appointments_payment_edit ? 'text-dark' : 'text-gray-500'}>Modifier les payments dans le RDV</span>
                                    </Label>
                                    <Label className="flex items-center space-x-2 mr-4 mb-5">
                                        <Checkbox checked={formData.roles.payments} onCheckedChange={checked => handleRoleChange("payments", checked)} />
                                        <span className={formData.roles.payments ? 'text-dark' : 'text-gray-500'}>Consulter la liste des réglements</span>
                                    </Label>
                                    <Label className="flex items-center space-x-2 mr-4 mb-5">
                                        <Checkbox checked={formData.roles.payments_print} onCheckedChange={checked => handleRoleChange("payments_print", checked)} />
                                        <span className={formData.roles.payments_print ? 'text-dark' : 'text-gray-500'}>Imprimer Facture/Devis</span>
                                    </Label>
                                    <Label className="flex items-center space-x-2 mr-4 mb-5">
                                        <Checkbox checked={formData.roles.settings} onCheckedChange={checked => handleRoleChange("settings", checked)} />
                                        <span className={formData.roles.settings ? 'text-dark' : 'text-gray-500'}>Modifier les informations générales</span>
                                    </Label>
                                    <Label className="flex items-center space-x-2 mb-5">
                                        <Checkbox checked={formData.roles.payments_totals} onCheckedChange={checked => handleRoleChange("payments_totals", checked)} />
                                        <span className={formData.roles.payments_totals ? 'text-dark' : 'text-gray-500'}>Voir les totaux des réglements</span>
                                    </Label>
                                </div>
                            </div>
                        }
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