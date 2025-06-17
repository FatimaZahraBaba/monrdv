import React, { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Loader2, Plus, Printer, SmartphoneNfc, Trash2, User, User2 } from "lucide-react";

import format from 'date-fns/format'
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import RequiredStar from "@/components/required";
import { Label } from "@/components/ui/label";
import { printAppointment } from "@/print";
import Permission from "./permission";
import { useNavigate } from "react-router-dom";
import RolesContext from "@/context/roles-context";
import Dropdown from "./dropdown";
import clsx from "clsx";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./ui/table";
import { getStatusBackground, getStatusBackgroundOnly, getStatusOptions, getStatusText } from "@/functions";
import ConfirmDialog from "./confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Datepicker from "./datepicker";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import PrinterDrawer from "./print-drawer";

const statusOptions = getStatusOptions();

const initialFormData = {
  patient_id: null,
  doctor_id: null,
  service_id: null,
  mutual_id: null,
  date: "",
  price: "",
  payments: [],
  status: {},
  statusList: []
}

const AppointmentModal = ({ isDialogOpen, setIsDialogOpen, validationCallback, data, evenetsList }) => {
  const navigate = useNavigate();
  const { checkRole } = useContext(RolesContext);
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [mutualsList, setMutualsList] = useState([]);
  const [pricesList, setPricesList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [timeSlots, setTimeSlots] = useState([
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ]);
  const [newPayment, setNewPayment] = useState("");
  const [newPaymentIsTpe, setNewPaymentIsTpe] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isPrintDrawerOpen, setIsPrintDrawerOpen] = useState(false);
  const [printContent, setPrintContent] = useState(null);
  const confirmDialog = useRef();
  const defaultPrice = useRef();
  const defaultService = useRef();

  useEffect(() => {
    setFormData({
      ...initialFormData,
      ...data,
      price: data?.id ? data.price : defaultPrice.current,
      service_id: data?.id ? data.service_id : defaultService.current,
    });
    setSelectedDate(data?.date);
    setSelectedTime(data?.date ? format(data.date, "HH:mm") : "");
    setNewStatus("")
    setNewPayment("")
    setNewPaymentIsTpe(false);
  }, [data])

  useEffect(() => {
    if (!formData.patient_id)
      return;

    const patient = patientsList.find((patient) => patient.id == formData.patient_id);
    setFormData({ ...formData, mutual_id: patient?.mutual_id });

  }, [formData.patient_id])

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(
        [
          "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
          "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
        ]
          .map((time) => {
            if (evenetsList.find((event) => event.status != "cancelled" && event.date && format(event.date, "dd-MM-y") == format(selectedDate, "dd-MM-y") && format(event.date, "HH:mm") === time)) {
              return { time, disabled: true };
            }
            return { time, disabled: false };
          })
      )
    }
  }, [selectedDate])

  useEffect(() => {
    fetchPricesList();
    fetchPatientsList();
    fetchDoctorsList();
    fetchServicesList();
    fetchMutualsList();

    document.addEventListener("keyup", (e) => {
      if (e.key === "F12" && (formData.id ? checkRole("appointments_edit") : checkRole("appointments_create"))) {
        handleConfirmation();
      }
    })

    return () => {
      document.removeEventListener("keyup", () => { });
    }
  }, [])

  useEffect(() => {
    if (formData.price && (Number(formData.price) == 0 || Number(formData.price) < formData.advance)) {
      setFormData({ ...formData, advance: "" });
    }
  }, [formData.price])

  useEffect(() => {
    if (formData.price && Number(formData.price) == formData.advance) {
      setFormData({ ...formData, paid: true });
    }
    else if (data && !data.paid) {
      setFormData({ ...formData, paid: false });
    }
  }, [formData.price, formData.advance])

  const fetchPatientsList = async () => {
    const resp = await axios.get("/patients");
    setPatientsList(resp.data);
  }

  const fetchDoctorsList = async () => {
    const resp = await axios.get("/doctors");
    setDoctorsList(resp);
  }

  const fetchServicesList = async () => {
    const resp = await axios.get("/services");
    setServicesList(resp);
    defaultService.current = resp.find(item => item.is_default)?.id;
  }

  const fetchPricesList = async () => {
    const resp = await axios.get("/prices");
    setPricesList(resp.map(item => ({
      value: item.price,
      label: item.price == 0 ? "Gratuit" : `${item.price} DH`,
    })));
    defaultPrice.current = resp.find(item => item.is_default)?.price;
  }

  const fetchMutualsList = async () => {
    const resp = await axios.get("/mutuals");
    setMutualsList(resp);
  }

  const handleAddDoctor = async () => {
    if (!newDoctorName) return;
    await axios.post("/doctors", { name: newDoctorName });
    setIsDoctorDialogOpen(false);
    fetchDoctorsList();
  };

  const handleAddService = async () => {
    if (!newServiceName) return;
    await axios.post("/services", { name: newServiceName });
    setIsServiceDialogOpen(false);
    fetchServicesList();
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onPriceChange = (value) => {
    confirmDialog.current.show({
      title: "Changement du prix",
      message: "Êtes-vous sûr de vouloir valider ce prix ? Cette action est définitive et ne pourra pas être modifiée.",
      onConfirm: () => {
        setFormData({ ...formData, price: value });
      }
    });
  }

  // Calculate remaining amount
  const resteAmount = (formData.price ? parseFloat(formData.price) : 0) - formData.payments.reduce((acc, payment) => acc + parseFloat(payment.amount), 0);

  // Handle form submission
  const handleSubmit = async (doPrint) => {
    setLoading(true);

    const data = {
      ...formData,
      advance: formData.payments.reduce((acc, payment) => acc + parseFloat(payment.amount), 0).toFixed(2),
      date: selectedDate && selectedTime ? format(selectedDate, "yyyy-MM-dd") + " " + selectedTime : null,
    }

    try {
      if (formData.id) {
        await axios.put(`/appointments/${formData.id}`, data);
      } else {
        await axios.post("/appointments", data);
      }

      setIsDialogOpen(false);
      validationCallback();

      if (newStatus == "instance")
        navigate("/appointments");

      if (doPrint) {
        const printData = {
          appointment_date: {
            dayName: format(data.date, "EEEE"),
            date: format(data.date, "dd/MM/yyyy"),
            time: format(data.date, "HH:mm"),
          },
          price: data.price,
          advance: data.advance,
          reste: resteAmount.toFixed(2),
          patient_name: data.patient_name || patientsList.find((patient) => patient.id == data.patient_id)?.name,
        };
        const html = printAppointment(printData);
        setPrintContent(html);
        setIsPrintDrawerOpen(true);
      }
    }
    finally {
      setLoading(false);
    }
  };

  const handleConfirmation = (doPrint) => {
    if (newPayment) {
      confirmDialog.current.show({
        title: "Validation du paiement",
        message: `Attention, vous avez oublié valider le paiement de ${newPayment} DH. Voulez-vous continuer ?`,
        yesText: "Oui, continuer sans valider",
        onConfirm: () => handleSubmit(doPrint)
      });
    }
    else {
      handleSubmit(doPrint);
    }
  }

  const handleNewPayment = () => {
    if (!parseFloat(newPayment) || parseFloat(newPayment) > resteAmount)
      return;

    setFormData({ ...formData, payments: [...formData.payments, { amount: parseFloat(newPayment).toFixed(2), is_tpe: newPaymentIsTpe, created_at: new Date() }] });
    setNewPayment("");
  }

  const handleNewStatus = () => {
    if (!newStatus)
      return;

    confirmDialog.current.show({
      title: "Validation du statut",
      message: "Êtes-vous sûr de vouloir changer le statut ? Cette action est irréversible",
      onConfirm: () => {
        setFormData({ ...formData, statusList: [...formData.statusList, { status: newStatus, created_at: new Date() }] });
        setNewStatus("");
      }
    });
  }

  const onIsTpeChanged = (checked) => {
    if (checked) {
      confirmDialog.current.show({
        title: "Confirmation de paiement par TPE",
        message: "Êtes-vous sûr de vouloir valider le paiement par TPE ?",
        onConfirm: () => {
          setNewPaymentIsTpe(checked);
        }
      });
    }
    else {
      setNewPaymentIsTpe(checked);
    }
  }

  return (
    <>
      {/* Appointment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => setIsDialogOpen(isOpen)}>
        <DialogContent id="appointment-modal" className={clsx("p-8", formData.id ? "max-w-6xl" : "max-w-3xl")}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
              <Loader2 className="h-10 w-10 animate-spin text-black" />
            </div>
          )}

          <DialogHeader>
            <div className={clsx("grid gap-10 items-center", formData.id ? "grid-cols-3" : "grid-cols-2")}>
              {
                formData.id ?
                  <span className="flex items-center space-x-4 rounded-lg bg-orange-600 text-white">
                    <span className="flex items-center justify-center w-14 h-14 rounded-lg bg-orange-700">
                      <User size={30} />
                    </span>
                    <DialogTitle className="text-xl font-bold font-secondary">{formData.patient_name}</DialogTitle>
                  </span>
                  :
                  <DialogTitle className="text-xl font-bold">Créer un rendez-vous</DialogTitle>
              }
              {
                formData.id && (
                  <DialogTitle className="text-xl font-bold">Statut</DialogTitle>
                )
              }

              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold">Encaissement</DialogTitle>
                <span className={clsx("font-bold text-sm py-1.5 px-3 rounded-lg", resteAmount > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")}>Reste {resteAmount} DH</span>
              </div>
            </div>
          </DialogHeader>

          <div className={clsx("grid gap-10", formData.id ? "grid-cols-3" : "grid-cols-2")}>
            <form className="space-y-6 mt-3">
              {/* Patient and Doctor Selection */}
              <div className="grid grid-cols-1 gap-6">
                {
                  !formData.id && (
                    <div>
                      <Label>Patient <RequiredStar /></Label>
                      <Dropdown
                        disabled={formData.id}
                        placeholder="Sélectionnez un patient"
                        name="patient_id"
                        value={formData.patient_id}
                        options={patientsList}
                        onChange={handleChange}
                        renderItem={item => (
                          <div className="flex items-center">
                            <span className={clsx("block w-2 h-2 mr-2 rounded", getStatusBackgroundOnly(item.last_appointment_status))}></span>
                            {item.name}
                          </div>
                        )} />
                    </div>
                  )
                }

                <div>
                  <Label>Médecin <RequiredStar /></Label>
                  <div className="flex gap-2">
                    <Dropdown disabled={formData.id} placeholder="Sélectionnez un médecin" name="doctor_id" value={formData.doctor_id} options={doctorsList} onChange={handleChange} />
                    {
                      !formData.id && (
                        <Permission name="doctors_create">
                          <Button style={{ flexShrink: 0 }} size="icon" asChild onClick={() => { setNewDoctorName(""); setIsDoctorDialogOpen(true) }}>
                            <span><Plus /></span>
                          </Button>
                        </Permission>
                      )
                    }
                  </div>
                </div>

                <div>
                  <Label>Prestation <RequiredStar /></Label>
                  <div className="flex gap-2">
                    <Dropdown disabled={formData.id} placeholder="Sélectionnez une prestation" name="service_id" value={formData.service_id} options={servicesList} onChange={handleChange} />
                    {
                      !formData.id && (
                        <Permission name="doctors_create">
                          <Button style={{ flexShrink: 0 }} size="icon" asChild onClick={() => { setNewServiceName(""); setIsServiceDialogOpen(true) }}>
                            <span><Plus /></span>
                          </Button>
                        </Permission>
                      )
                    }
                  </div>
                </div>

                {/* <div>
                  <Label>Avance</Label>
                  <Input disabled={formData.price == 0} id="advance" name="advance" placeholder="Entrez l'avance" value={formData.advance} onChange={handleChange} type="number" />
                </div>
                <div>
                  <Label>Reste à payer</Label>
                  <Input id="reste" name="reste" value={`${resteAmount} DH`} disabled />
                </div> */}

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <Label>Date du rendez-vous</Label>
                    <Datepicker value={selectedDate} onChange={({ date }) => setSelectedDate(date)} />
                  </div>
                  <div className="w-24">
                    <Label>Heure</Label>
                    <Select onValueChange={setSelectedTime} value={selectedTime} required>
                      <SelectTrigger className={selectedTime ? 'font-bold' : 'text-muted-foreground'}>
                        <SelectValue placeholder="-- : --" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((item, index) => (
                          <SelectItem key={index} value={item.time || item} disabled={item.disabled} style={item.disabled && { color: "#c61b17", opacity: 1 }}>
                            {item.time || item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </form>
            {
              formData.id &&
              <div className="mt-2 flex flex-col space-y-3">
                <div className="flex">
                  <Select onValueChange={setNewStatus} value={newStatus}>
                    <SelectTrigger className={clsx({ "font-bold": newStatus, "text-muted-foreground": !newStatus }, getStatusBackground(newStatus))} style={{ padding: "0.5rem 1rem" }}>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        statusOptions.filter(item => !formData.statusList?.map(item => item.status)?.includes(item.id)).map((status, index) => (
                          <SelectItem key={index} value={status.id}>
                            <div className="flex items-center">
                              <span className={clsx("block w-2 h-2 mr-2 rounded", getStatusBackgroundOnly(status.id))}></span>
                              {status.name}
                            </div>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  {
                    newStatus && (
                      <Button style={{ flexShrink: 0 }} className="ml-2" onClick={handleNewStatus}>Confirmer</Button>
                    )
                  }
                </div>
                <div className="bg-gray-100 p-2 rounded-lg border-2 border-primary flex-grow flex flex-col space-y-3">
                  {
                    formData.statusList.length > 0 && (
                      <Table className="w-full bg-white rounded-lg">
                        <TableHeader className="text-gray-500">
                          <TableRow>
                            <TableCell className="py-3">Statut</TableCell>
                            <TableCell className="py-3 pl-0 text-left">Date</TableCell>
                            <Permission name="appointments_status_edit">
                              <TableCell className="py-3 pl-0 w-0"></TableCell>
                            </Permission>
                            <TableCell className="py-3 w-0 pl-0"></TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {
                            formData.statusList.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="py-3 font-bold">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <span className={clsx("py-1 px-2 rounded-md text-nowrap", getStatusBackground(item.status))}>
                                        {getStatusText(item.status)}
                                      </span>
                                    </DropdownMenuTrigger>
                                    <Permission name="appointments_status_edit">
                                      <DropdownMenuContent>
                                        <DropdownMenuGroup>
                                          {
                                            statusOptions.filter(item => !formData.statusList?.map(item => item.status)?.includes(item.id)).map((statusOption, i) => (
                                              <DropdownMenuItem key={i} onClick={() => {
                                                const updatedItem = { ...item, status: statusOption.id };
                                                setFormData({ ...formData, statusList: formData.statusList.map((status, i) => i == index ? updatedItem : status) });
                                              }}>
                                                <div className="flex items-center">
                                                  <span className={clsx("block w-2 h-2 mr-2 rounded", getStatusBackgroundOnly(statusOption.id))}></span>
                                                  {statusOption.name}
                                                </div>
                                              </DropdownMenuItem>
                                            ))
                                          }
                                        </DropdownMenuGroup>
                                      </DropdownMenuContent>
                                    </Permission>
                                  </DropdownMenu>
                                </TableCell>
                                <TableCell className="py-3 pl-0 text-nowrap text-xs">{format(item.updated_at || item.created_at, "dd-MM-y")}</TableCell>
                                <Permission name="appointments_status_edit">
                                  <TableCell className="py-3 pl-0 text-right w-0">
                                    <Trash2
                                      size={16}
                                      className="cursor-pointer text-red-500 hover:text-red-700"
                                      onClick={() => {
                                        const updatedList = formData.statusList.filter((status, i) => i != index);
                                        setFormData({ ...formData, statusList: updatedList });
                                      }} />
                                  </TableCell>
                                </Permission>
                                <TableCell className="py-3 w-0 pl-0">
                                  <HoverCard>
                                    <HoverCardTrigger>
                                      <User size={16} className="cursor-pointer" />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-42">
                                      <Table className="w-full bg-white rounded-lg">
                                        <TableBody>
                                          {
                                            item.created_by &&
                                            <TableRow>
                                              <TableCell className="py-3 font-bold text-nowrap align-top">Créé par</TableCell>
                                              <TableCell className="py-3 text-nowrap align-top">
                                                {item.created_by}
                                                <small className="block">le {format(item.created_at, "dd/MM/y à HH:mm:ss")}</small>
                                              </TableCell>
                                            </TableRow>
                                          }
                                          {
                                            item.updated_by &&
                                            <TableRow>
                                              <TableCell className="py-3 font-bold text-nowrap align-top">Modifié par</TableCell>
                                              <TableCell className="py-3 text-nowrap align-top">
                                                {item.updated_by}
                                                <small className="block">le {format(item.updated_at, "dd/MM/y à HH:mm:ss")}</small>
                                              </TableCell>
                                            </TableRow>
                                          }
                                        </TableBody>
                                      </Table>
                                    </HoverCardContent>
                                  </HoverCard>
                                </TableCell>
                              </TableRow>
                            ))
                          }
                        </TableBody>
                      </Table>
                    )
                  }
                </div>

                <label className="flex items-center space-x-3 py-2.5 px-3 rounded-lg border-2 border-primary">
                  <Switch checked={formData.positif_molding} onCheckedChange={(value) => handleChange({ target: { name: "positif_molding", value } })} />
                  <span className="mb-0 font-bold text-md">Moulage positif</span>
                </label>
                <label className="flex items-center space-x-3 py-2.5 px-3 rounded-lg border-2 border-primary">
                  <Switch checked={formData.absent} onCheckedChange={(value) => handleChange({ target: { name: "absent", value } })} />
                  <span className="mb-0 font-bold text-md">Le patient est absent</span>
                </label>
              </div>
            }
            <div className="mt-2 flex flex-col space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select disabled={formData.id && !checkRole("appointments_price_edit")} onValueChange={onPriceChange} value={formData.price}>
                    <SelectTrigger className={clsx({ "font-bold": formData.price }, { 'text-muted-foreground': !formData.price })}>
                      <SelectValue className="font-bold" placeholder="Prix" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        pricesList.map((price, index) => (
                          <SelectItem key={index} value={price.value}>
                            {price.label}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select onValueChange={(value) => setFormData({ ...formData, mutual_id: value })} value={formData.mutual_id}>
                    <SelectTrigger className={clsx({ "font-bold": formData.mutual_id }, { 'text-muted-foreground': !formData.mutual_id })}>
                      <SelectValue placeholder="Mutuelle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Sans mutuelle</SelectItem>
                      {
                        mutualsList.map((mutual, index) => (
                          <SelectItem key={index} value={mutual.id}>
                            {mutual.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg border-2 border-primary flex-grow flex flex-col space-y-3">
                {
                  formData.payments.length > 0 && (
                    <Table className="w-full bg-white rounded-lg">
                      <TableHeader className="text-gray-500">
                        <TableRow>
                          <TableCell className="py-3">Avance</TableCell>
                          <TableCell className="py-3 pl-0">Date</TableCell>
                          <Permission name="appointments_payment_edit">
                            <TableCell className="py-3 w-0 pl-0"></TableCell>
                          </Permission>
                          <TableCell className="py-3 w-0 pl-0"></TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {
                          formData.payments.map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell className="py-3 font-bold">
                                <span
                                  className="p-1"
                                  contentEditable={checkRole('appointments_payment_edit')}
                                  onBlur={(e) => {
                                    const amount = Number(e.target.innerText);
                                    if (!isNaN(amount) && amount > 0) {
                                      const total = formData.payments.reduce((acc, payment, i) => i != index ? acc + parseFloat(payment.amount) : acc, amount);
                                      if (total <= formData.price) {
                                        const updatedList = formData.payments.map((payment, i) => i == index ? { ...payment, amount: amount.toFixed(2) } : payment);
                                        setFormData({ ...formData, payments: updatedList });
                                      }
                                      else {
                                        e.target.innerText = payment.amount;
                                      }
                                    }
                                    else {
                                      e.target.innerText = payment.amount;
                                    }
                                  }}>
                                  {payment.amount}
                                </span> DH
                              </TableCell>
                              <TableCell className="py-3 pl-0 text-nowrap text-xs">{format(payment.updated_at || payment.created_at, "dd-MM-y")}</TableCell>
                              <TableCell className="py-3 pl-0 w-0">
                                {
                                  payment.is_tpe == true &&
                                  <small className="font-bold text-orange-600">TPE</small>
                                }
                              </TableCell>
                              <Permission name="appointments_payment_edit">
                                <TableCell className="py-3 w-0 pl-0">
                                  <Trash2
                                    size={16}
                                    className="cursor-pointer text-red-500 hover:text-red-700"
                                    onClick={() => {
                                      const updatedList = formData.payments.filter((payment, i) => i != index);
                                      setFormData({ ...formData, payments: updatedList });
                                    }} />
                                </TableCell>
                              </Permission>
                              <TableCell className="py-3 w-0 pl-0">
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <User size={16} className="cursor-pointer" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-42">
                                    <Table className="w-full bg-white rounded-lg">
                                      <TableBody>
                                        {
                                          payment.created_by &&
                                          <TableRow>
                                            <TableCell className="py-3 font-bold text-nowrap align-top">Créé par</TableCell>
                                            <TableCell className="py-3 text-nowrap align-top">
                                              {payment.created_by}
                                              <small className="block">le {format(payment.created_at, "dd/MM/y à HH:mm:ss")}</small>
                                            </TableCell>
                                          </TableRow>
                                        }
                                        {
                                          payment.updated_by &&
                                          <TableRow>
                                            <TableCell className="py-3 font-bold text-nowrap align-top">Modifié par</TableCell>
                                            <TableCell className="py-3 text-nowrap align-top">
                                              {payment.updated_by}
                                              <small className="block">le {format(payment.updated_at, "dd/MM/y à HH:mm:ss")}</small>
                                            </TableCell>
                                          </TableRow>
                                        }
                                      </TableBody>
                                    </Table>
                                  </HoverCardContent>
                                </HoverCard>
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  )
                }

                {
                  resteAmount > 0 && (
                    <div className="flex space-x-3">
                      <Input
                        className="h-full"
                        type="number"
                        placeholder="Avance reçue"
                        value={newPayment}
                        onChange={e => setNewPayment(e.target.value)}
                        onKeyUp={e => e.key == "Enter" && handleNewPayment()} />
                      <label>
                        <span className="text-xs">TPE</span>
                        <Switch checked={newPaymentIsTpe} onCheckedChange={onIsTpeChanged} />
                      </label>
                      <Button style={{ flexShrink: 0 }} className="h-full" onClick={handleNewPayment}>Encaisser</Button>
                    </div>
                  )
                }

                {
                  !formData.id && formData.price && formData.price != 0 && !formData.payments.length && (
                    <p className="p-3 text-sm text-center bg-red-100 text-red-700 rounded-lg">
                      Si aucune avance n'est renseignée, le statut sera défini automatiquement en <b>En instance</b>
                    </p>
                  )
                }
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <DialogFooter>
            <Permission name={formData.id ? "appointments_edit" : "appointments_create"}>
              <DialogClose asChild>
                <Button disabled={loading} variant="outline">Annuler</Button>
              </DialogClose>
              <Button className="w-32" disabled={loading} onClick={() => handleConfirmation()}>
                {formData.id ? "Mettre à jour" : "Créer"}
              </Button>
              <Button disabled={loading} onClick={() => handleConfirmation(true)}>
                <span>{formData.id ? "Mettre à jour" : "Créer"} et imprimer</span>
                <Printer size={16} className="ml-2" />
              </Button>
            </Permission>
          </DialogFooter>

          <ConfirmDialog ref={confirmDialog} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un médecin</DialogTitle>
          </DialogHeader>
          <Input value={newDoctorName} onChange={(e) => setNewDoctorName(e.target.value)} placeholder="Nom du médecin" />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleAddDoctor}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une prestation</DialogTitle>
          </DialogHeader>
          <Input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleAddService}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrinterDrawer
        isOpen={isPrintDrawerOpen}
        setIsOpen={setIsPrintDrawerOpen}
        data={printContent}
        title="Fiche du rendez-vous"
        rectoVerso />
    </>
  );
};

export default AppointmentModal;
