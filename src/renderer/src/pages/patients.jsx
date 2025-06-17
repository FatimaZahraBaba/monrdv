import React, { useContext, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Edit, FilterX, Info, Loader2, Plus, Printer, Star, Trash2, User, UserCircle, UserPlus, UserSearch, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Toolbar from "@/components/toolbar";
import AppointmentLegend from "@/components/appointments-legend";
import axios from "axios";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import RequiredStar from "@/components/required";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { printAppointment, printPatients } from "@/print";
import Permission from "@/components/permission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Dropdown from "@/components/dropdown";
import RolesContext from "@/context/roles-context";
import { formatPhone, getStatusBackground, getStatusBackgroundOnly, getStatusOptions, getWorkshopStatusBackground, getWorkshopStatusBackgroundOnly, getWorkshopStatusOptions } from "@/functions";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import clsx from "clsx";
import RangePicker from "@/components/rangepicker";
import PrinterDrawer from "@/components/print-drawer";
import DatePagination from "@/components/date-pagination";
import TablePagination from "@/components/table-pagination";
import { Switch } from "@/components/ui/switch";

const initialFormData = {
    last_name: "",
    first_name: "",
    phone: "",
    phone2: "",
    cin: "",
    address: "",
    note: "",
    mutual_id: ""
};

const statusOptions = getStatusOptions();
const workshopStatusOptions = getWorkshopStatusOptions();

const PatientsPage = () => {
    const { checkRole } = useContext(RolesContext);
    const [patientsList, setPatientsList] = useState([]);
    const [mutualsList, setMutualsList] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMutualDialogOpen, setIsMutualDialogOpen] = useState(false);
    const [newMutualName, setNewMutualName] = useState("");
    const [isPrintDrawerOpen, setIsPrintDrawerOpen] = useState(false);
    const [printContent, setPrintContent] = useState(null);
    const [printTitle, setPrintTitle] = useState(null);
    const [isRectoVerso, setIsRectoVerso] = useState(null);
    const [filters, setFilters] = useState({
        name: "",
        phone: "",
        has_note: null
    });
    const pageDateRef = useRef(new Date());
    const [isNoFilter, setIsNoFilter] = useState(true);
    const isNoFilterRef = useRef(isNoFilter);
    const activePageRef = useRef(1);
    const [pagination, setPagination] = useState({
        pagesNumber: 0,
        activePage: 1
    });
    const [itemsCount, setItemsCount] = useState(null);

    useEffect(() => {
        const noFilter = Object.values(filters).every((value) => value === "" || value === null || value === undefined);
        isNoFilterRef.current = noFilter;
        activePageRef.current = 1;
        setPagination({ ...pagination, activePage: 1 });
        setIsNoFilter(noFilter);
        fetchPatientsList();
    }, [filters])

    useEffect(() => {
        fetchMutualsList();

        document.addEventListener("keyup", (e) => {
            if (e.key === "F12" && isDialogOpen && (formData.id ? checkRole("patients_edit") : checkRole("patients_create"))) {
                handleSubmit()
            }
        });

        return () => {
            document.removeEventListener("keyup", () => { });
        }
    }, []);

    const fetchPatientsList = async () => {
        const from = isNoFilterRef.current ? pageDateRef.current : filters.daterange?.from;
        const to = isNoFilterRef.current ? pageDateRef.current : filters.daterange?.to;
        const resp = await axios.get("/patients", {
            params: {
                ...filters,
                daterange: {
                    from: from && format(from, "yyyy-MM-dd 00:00:00"),
                    to: to && format(to, "yyyy-MM-dd 23:59:59"),
                },
                page: isNoFilterRef.current ? null : activePageRef.current,
            }
        });
        setPatientsList(resp.data);
        setPagination({
            pagesNumber: resp.pagesNumber,
            activePage: resp.activePage
        });
        setItemsCount(resp.count);
    };

    const fetchMutualsList = async () => {
        const resp = await axios.get("/mutuals");
        setMutualsList(resp);
    };

    const openDialog = (patient = null) => {
        setFormData(patient ? { ...patient } : initialFormData);
        setIsDialogOpen(true);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (doPrint) => {
        try {
            setLoading(true);
            if (formData.id) {
                await axios.put(`/patients/${formData.id}`, formData);
            } else {
                await axios.post("/patients", formData);
            }
            setIsDialogOpen(false);
            fetchPatientsList();

            if (doPrint) {
                const printData = {
                    patient_name: `${formData.last_name} ${formData.first_name}`,
                    patient_phone: formData.phone,
                    patient_phone2: formData.phone2,
                    patient_address: formData.address,
                    print_date: format(new Date(), "dd/MM/yyyy")
                };
                const html = printAppointment(printData);
                setPrintContent(html);
                setIsPrintDrawerOpen(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const onPatientPrint = (patient) => {
        const printData = {
            patient_name: patient.name,
            patient_phone: patient.phone,
            patient_phone2: patient.phone2,
            patient_address: patient.address,
            print_date: format(new Date(), "dd/MM/yyyy"),
        };
        const html = printAppointment(printData);
        setPrintContent(html);
        setPrintTitle("Fiche du patient");
        setIsRectoVerso(true);
        setIsPrintDrawerOpen(true);
    };

    const confirmDeletePatient = (patient) => {
        setSelectedPatient(patient);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePatient = async (id) => {
        await axios.delete(`/patients/${id}`);
        fetchPatientsList();
        setIsDeleteDialogOpen(false);
    };

    const handleAddMutual = async () => {
        if (!newMutualName) return;
        await axios.post("/mutuals", { name: newMutualName });
        setIsMutualDialogOpen(false);
        fetchMutualsList();
    };

    const onDatePaginationChange = (date) => {
        pageDateRef.current = date;
        fetchPatientsList();
    }

    const onWorkshopStatusChange = async (status, patient) => {
        try {
            await axios.put(`/appointments/${patient.last_appointment_id}/workshop`, { status });
        }
        finally {
            fetchPatientsList();
        }
    }

    const onFavoriteChanged = async (patient) => {
        try {
            await axios.put(`/patients/${patient.id}/favorite`, { favorite: !patient.favorite });
        } finally {
            fetchPatientsList();
        }
    }

    const onPatientsPrint = async () => {
        let patients = patientsList;
        if (pagination.pagesNumber > 1) {
            const resp = await axios.get("/patients", {
                params: {
                    ...filters,
                    daterange: {
                        from: filters.daterange?.from && format(filters.daterange.from, "yyyy-MM-dd 00:00:00"),
                        to: filters.daterange?.to && format(filters.daterange.to, "yyyy-MM-dd 23:59:59"),
                    }
                }
            });
            patients = resp.data;
        }

        const html = printPatients(patients);
        setPrintContent(html);
        setPrintTitle("Liste des patients");
        setIsRectoVerso(false);
        setIsPrintDrawerOpen(true);
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar */}
            <Toolbar title={() => <>
                Liste des patients&nbsp;
                {
                    itemsCount > 0 &&
                    <small className="font-normal">({itemsCount})</small>
                }
            </>}>
                {
                    patientsList.length > 0 &&
                    <Button onClick={onPatientsPrint} className="ml-2" variant="secondary">
                        <Printer className="mr-1 !w-5 !h-5" /> Imprimer
                    </Button>
                }
                <Permission name="patients_create">
                    <Button onClick={() => openDialog()} className="ml-2">
                        <UserPlus className="mr-1 !w-5 !h-5" /> Ajouter
                    </Button>
                </Permission>
                
                <AppointmentLegend />
            </Toolbar>

            {/* Filters */}
            <Card className="border-none">
                <CardContent className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] space-x-6 py-4">
                    <div>
                        <RangePicker placeholder="Filtrer par date de création" value={filters.daterange} onChange={daterange => setFilters({ ...filters, daterange })} clearable />
                    </div>
                    <div>
                        <Input placeholder="Nom ou téléphone" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
                    </div>

                    <div>
                        <Dropdown
                            placeholder="Statut"
                            options={statusOptions}
                            value={filters.status}
                            onChange={({ id }) => setFilters({ ...filters, status: id })}
                            clearable
                            searchable={false}
                            triggerClass={value => getStatusBackground(value)}
                            renderItem={(item) => (
                                <div className="flex items-center">
                                    <span className={clsx("block w-2 h-2 mr-2 rounded", getStatusBackgroundOnly(item.id))}></span>
                                    {item.name}
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <Dropdown
                            placeholder="Statuts atelier"
                            options={workshopStatusOptions}
                            value={filters.workshop_status}
                            onChange={({ id }) => setFilters({ ...filters, workshop_status: id })}
                            clearable
                            searchable={false}
                            triggerClass={value => getWorkshopStatusBackground(value)}
                            renderItem={(item) => (
                                <div className="flex items-center">
                                    <span className={clsx("block w-2 h-2 mr-2 rounded", getWorkshopStatusBackgroundOnly(item.id))}></span>
                                    {item.name}
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <Dropdown
                            placeholder="Mutuelle"
                            options={[
                                { id: "all", name: "Toutes les mutuelles" },
                                { id: "none", name: "Sans mutuelle" },
                                ...mutualsList
                            ]}
                            value={filters.mutual}
                            onChange={({ id }) => setFilters({ ...filters, mutual: id })}
                            clearable />
                    </div>

                    <div className="flex justify-around space-x-6">
                        <div>
                            <Label className="mb-2 text-gray-500">Favoris</Label>
                            <RadioGroup className="flex" value={filters.favorite} onValueChange={(value) => setFilters({ ...filters, favorite: value })}>
                                <Label className="flex items-center space-x-1 mb-0">
                                    <RadioGroupItem value="yes" />
                                    <span>Oui</span>
                                </Label>
                                <Label className="flex items-center space-x-1 mb-0">
                                    <RadioGroupItem value="no" />
                                    <span>Non</span>
                                </Label>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label className="mb-2 text-gray-500">Remarque</Label>
                            <RadioGroup className="flex" value={filters.has_note} onValueChange={(value) => setFilters({ ...filters, has_note: value })}>
                                <Label className="flex items-center space-x-1 mb-0">
                                    <RadioGroupItem value="yes" />
                                    <span>Oui</span>
                                </Label>
                                <Label className="flex items-center space-x-1 mb-0">
                                    <RadioGroupItem value="no" />
                                    <span>Non</span>
                                </Label>
                            </RadioGroup>
                        </div>
                    </div>

                    <Button size="icon" onClick={() => {
                        setFilters({
                            name: "",
                            phone: "",
                            favorite: null,
                            has_note: null
                        })
                    }}>
                        <FilterX />
                    </Button>
                </CardContent>
            </Card>

            {/* Patients Table */}
            <Card className="border-none flex flex-col flex-1 overflow-hidden">
                <CardContent className="h-full flex flex-col space-y-3 py-6">
                    <div className="overflow-y-auto flex-1">
                        {patientsList.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Statut atelier</TableHead>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Prénom</TableHead>
                                        <TableHead>Créé le</TableHead>
                                        <TableHead>Téléphone</TableHead>
                                        <TableHead>Mutuelle</TableHead>
                                        <TableHead>Dérnier RDV</TableHead>
                                        <TableHead><Info size={19} /></TableHead>
                                        <TableHead><User size={20} /></TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {patientsList.map((patient) => (
                                        <TableRow key={patient.id}>
                                            <TableCell className="py-3 w-0">
                                                <Star size={17} color={patient.favorite ? "#ea580b" : "#888"} fill={patient.favorite ? "#ea580b" : "transparent"} className="cursor-pointer" onClick={() => onFavoriteChanged(patient)} />
                                            </TableCell>
                                            <TableCell className="py-3 w-0">
                                                <Dropdown
                                                    placeholder="Non envoyée"
                                                    options={workshopStatusOptions}
                                                    value={patient.workshop_status || "not_sent"}
                                                    onChange={({ id }) => onWorkshopStatusChange(id, patient)}
                                                    clearable
                                                    searchable={false}
                                                    disabled={!patient.last_appointment_id}
                                                    simple
                                                    triggerClass={value => getWorkshopStatusBackground(value)}
                                                    renderItem={(item) => (
                                                        <div className="flex items-center">
                                                            <span className={clsx("block w-2 h-2 mr-2 rounded", getWorkshopStatusBackgroundOnly(item.id))}></span>
                                                            {item.name}
                                                        </div>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="py-3"><b>{patient.last_name}</b></TableCell>
                                            <TableCell className="py-3"><b>{patient.first_name}</b></TableCell>
                                            <TableCell className="py-3 text-nowrap">
                                                <span className="capitalize">{format(patient.created_at, "dd MMM y")}</span>
                                                <span>{format(patient.created_at, " à HH:mm")}</span>
                                            </TableCell>
                                            <TableCell className="py-3 text-nowrap">
                                                {patient.phone}
                                                {patient.phone2 && <br />}
                                                {patient.phone2}
                                            </TableCell>
                                            <TableCell className="py-3"><small>{patient.mutual_name}</small></TableCell>
                                            <TableCell className="py-3 text-nowrap">
                                                {
                                                    (patient.last_appointment_status == "instance" || patient.last_appointment_date) && (
                                                        <Badge className={clsx("appointment-status-badge justify-center min-w-[116px]", getStatusBackground(patient.last_appointment_status), { molding: patient.last_appointment_positive_molding, absent: patient.last_appointment_absent, done: patient.last_appointment_status != "active" && patient.last_appointment_status != "instance" })}>
                                                            {
                                                                patient.last_appointment_status == "instance"
                                                                ? "En instance"
                                                                :
                                                                <span>
                                                                    <span className="capitalize">{format(patient.last_appointment_date, "dd MMM")}</span>
                                                                    <span>{format(patient.last_appointment_date, " à HH:mm")}</span>
                                                                </span>
                                                            }
                                                        </Badge>
                                                    )}
                                            </TableCell>
                                            <TableCell className="py-3 w-0">
                                                {
                                                    patient.note && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger className="flex">
                                                                    <Info size={19} />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs">
                                                                    {patient.note}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )
                                                }
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <HoverCard>
                                                    <HoverCardTrigger>
                                                        <span className="cursor-pointer hover:text-green-700">{patient.updated_by || patient.created_by}</span>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-42">
                                                        <Table className="w-full bg-white rounded-lg">
                                                            <TableBody>
                                                                {
                                                                    patient.created_by &&
                                                                    <TableRow>
                                                                        <TableCell className="py-3 font-bold text-nowrap align-top">Créé par</TableCell>
                                                                        <TableCell className="py-3 text-nowrap align-top">
                                                                            {patient.created_by}
                                                                            <small className="block">le {format(patient.created_at, "dd/MM/y à HH:mm:ss")}</small>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                }
                                                                {
                                                                    patient.updated_by &&
                                                                    <TableRow>
                                                                        <TableCell className="py-3 font-bold text-nowrap align-top">Modifié par</TableCell>
                                                                        <TableCell className="py-3 text-nowrap align-top">
                                                                            {patient.updated_by}
                                                                            <small className="block">le {format(patient.updated_at, "dd/MM/y à HH:mm:ss")}</small>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                }
                                                            </TableBody>
                                                        </Table>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            </TableCell>

                                            <TableCell className="py-3 text-center">
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="outline" className="h-auto p-2" onClick={() => openDialog(patient)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-auto p-2" onClick={() => onPatientPrint(patient)}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Permission name="patients_delete">
                                                        <Button disabled={patient.favorite} size="sm" variant="destructive" className="h-auto p-2" onClick={() => confirmDeletePatient(patient)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </Permission>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <UserCircle className="mx-auto mb-4 text-gray-400" size={80} strokeWidth={1} />
                                <p className="text-gray-400 max-w-48 text-center">Aucun patient enregistré pour le moment</p>
                            </div>
                        )}
                    </div>
                    {
                        isNoFilter ?
                            <DatePagination onChange={onDatePaginationChange} />
                            :
                            <TablePagination pagesNumber={pagination.pagesNumber} activePage={pagination.activePage} setActivePage={(page) => {
                                activePageRef.current = page;
                                setPagination({ ...pagination, activePage: page });
                                fetchPatientsList();
                            }} />
                    }
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold text-xl">Supprimer le patient</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer <b>{selectedPatient?.name}</b>? <br />
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePatient(selectedPatient.id)} className="bg-red-600 hover:bg-red-700">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Patient Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
                            <Loader2 className="h-10 w-10 animate-spin text-black" />
                        </div>
                    )}

                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{formData.id ? "Modifier le patient" : "Ajouter un patient"}</DialogTitle>
                    </DialogHeader>

                    <form className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Nom <RequiredStar /></Label>
                                <Input
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    placeholder="Entrez le nom du patient"
                                    onBlur={() => setFormData({ ...formData, last_name: formData.last_name.toUpperCase() })} />
                            </div>
                            <div>
                                <Label>Prénom <RequiredStar /></Label>
                                <Input
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    placeholder="Entrez le prénom du patient"
                                    onBlur={() => setFormData({ ...formData, first_name: formData.first_name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Téléphone <RequiredStar /></Label>
                                <Input
                                    name="phone"
                                    placeholder="Téléphone principal"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    onBlur={() => setFormData({ ...formData, phone: formatPhone(formData.phone) })} />
                            </div>
                            <div>
                                <Label>Téléphone secondaire</Label>
                                <Input
                                    name="phone2"
                                    value={formData.phone2}
                                    onChange={handleInputChange}
                                    onBlur={() => setFormData({ ...formData, phone2: formatPhone(formData.phone2) })} />
                            </div>
                            <div>
                                <Label>CIN</Label>
                                <Input name="cin" value={formData.cin} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label>Mutuelle</Label>
                                <div className="flex gap-2">
                                    <Dropdown placeholder="Sélectionnez une mutuelle" options={mutualsList} name="mutual_id" value={formData.mutual_id} onChange={handleInputChange} clearable />
                                    <Permission name="mutuals_create">
                                        <Button asChild onClick={() => { setNewMutualName(""); setIsMutualDialogOpen(true) }}>
                                            <span><Plus size={16} /></span>
                                        </Button>
                                    </Permission>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label>Adresse <RequiredStar /></Label>
                                <Textarea name="address" value={formData.address} onChange={handleInputChange} />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="mb-0">Remarques</Label>
                                    {
                                        formData.note && (
                                            <div className="flex items-center space-x-2">
                                                <Switch checked={formData.favorite} onCheckedChange={checked => setFormData({ ...formData, favorite: checked })} />
                                                <span className="font-semibold text-sm">Favoris</span>
                                            </div>
                                        )
                                    }
                                </div>
                                <Textarea name="note" value={formData.note} onChange={handleInputChange} />
                            </div>
                        </div>
                    </form>

                    <Permission name={formData.id ? "patients_edit" : "patients_create"}>
                        <Separator className="my-6" />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button disabled={loading} variant="outline">Annuler</Button>
                            </DialogClose>
                            <Button className="w-32" disabled={loading} onClick={() => handleSubmit()}>
                                {formData.id ? "Mettre à jour" : "Créer"}
                            </Button>
                            <Button disabled={loading} onClick={() => handleSubmit(true)}>
                                <span>{formData.id ? "Mettre à jour" : "Créer"} et imprimer</span>
                                <Printer size={16} className="ml-2" />
                            </Button>
                        </DialogFooter>
                    </Permission>
                </DialogContent>
            </Dialog>

            <Dialog open={isMutualDialogOpen} onOpenChange={setIsMutualDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter une mutuelle</DialogTitle>
                    </DialogHeader>
                    <Input value={newMutualName} onChange={(e) => setNewMutualName(e.target.value)} placeholder="Nom de la mutuelle" />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleAddMutual}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PrinterDrawer
                isOpen={isPrintDrawerOpen}
                setIsOpen={setIsPrintDrawerOpen}
                data={printContent}
                title={printTitle}
                rectoVerso={isRectoVerso}/>
        </div>
    );
};

export default PatientsPage;
