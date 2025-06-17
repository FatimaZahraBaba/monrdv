import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { CalendarIcon, CalendarPlus, Edit, FilterX, Printer, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Toolbar from "@/components/toolbar";
import AppointmentLegend from "@/components/appointments-legend";
import axios from "axios";
import { format } from "date-fns";
import { printAppointment } from "@/print";
import AppointmentModal from "@/components/appointment-modal";
import Permission from "@/components/permission";
import { useNavigate } from "react-router-dom";
import Dropdown from "@/components/dropdown";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getStatusBackground, getStatusBackgroundOnly, getStatusOptions, getWorkshopStatusBackground, getWorkshopStatusBackgroundOnly, getWorkshopStatusOptions } from "@/functions";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import clsx from "clsx";
import PrinterDrawer from "@/components/print-drawer";
import { Input } from "@/components/ui/input";
import RangePicker from "@/components/rangepicker";

const statusOptions = getStatusOptions();
const workshopStatusOptions = getWorkshopStatusOptions();

const AppointmentsPage = () => {
  const navigate = useNavigate()
  const [evenetsList, setEventsList] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrintDrawerOpen, setIsPrintDrawerOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [filters, setFilters] = useState({
    name: ""
  });
  const [printContent, setPrintContent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [filters])

  const fetchEvents = async () => {
    const resp = await axios.get("/appointments", {
      params: {
        ...filters,
        daterange: {
          from: filters.daterange?.from && format(filters.daterange.from, "yyyy-MM-dd 00:00:00"),
          to: filters.daterange?.to && format(filters.daterange.to, "yyyy-MM-dd 23:59:59"),
        }
      }
    });

    setEventsList(resp.map((event) => {
      return {
        ...event,
        date: event.date && new Date(event.date),
      }
    }));
  }

  const openDialog = (appointment = null) => {
    setFormData({ ...appointment });
    setIsDialogOpen(true);
  };

  const onAppointmentPrint = (data) => {
    const resteAmount = (data.price ? parseFloat(data.price) : 0) - (data.advance ? parseFloat(data.advance) : 0);
    const printData = {
      appointment_date: {
        dayName: format(data.date, "EEEE"),
        date: format(data.date, "dd/MM/yyyy"),
        time: format(data.date, "HH:mm"),
      },
      price: data.price,
      advance: data.advance,
      reste: resteAmount.toFixed(2),
      patient_name: data.patient_name,
    };
    const html = printAppointment(printData);
    setPrintContent(html);
    setIsPrintDrawerOpen(true);
  }

  const onWorkshopStatusChange = async (status, appointment) => {
    try {
      await axios.put(`/appointments/${appointment.id}/workshop`, { status });
    }
    finally {
      fetchEvents();
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Toolbar title={() => <>Gestion des rendez-vous <small className="font-normal">({evenetsList.length})</small></>} afterSearch={
        <>
          <AppointmentLegend />
          <Button onClick={() => navigate("/")} className="ml-2">
            <CalendarIcon size={16} />
          </Button>
        </>
      }>
        <Permission name="appointments_create">
          <Button onClick={() => openDialog()} className="ml-2">
            <CalendarPlus className="mr-1 !w-5 !h-5" /> Ajouter
          </Button>
        </Permission>
      </Toolbar>

      {/* Filters */}
      <Card className="border-none">
        <CardContent className="grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto] space-x-6 py-4">
          <div>
            <RangePicker placeholder="Filtrer par date" value={filters.daterange} onChange={daterange => setFilters({ ...filters, daterange })} clearable />
          </div>

          <div>
            <Input placeholder="Nom ou téléphone" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
          </div>

          {/* <div>
            <Dropdown placeholder="Filter par médecin" options={doctorsList} value={filters.doctor} onChange={({ id }) => setFilters({ ...filters, doctor: id })} clearable />
          </div> */}

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

          <div className="flex justify-around space-x-6">
            {/* <div>
              <Label className="mb-2 text-gray-500">En instance</Label>
              <RadioGroup className="flex space-x-2" value={filters.is_instance} onValueChange={(value) => setFilters({ ...filters, is_instance: value })}>
                <Label className="flex items-center space-x-1 mb-0">
                  <RadioGroupItem value="yes" />
                  <span>Oui</span>
                </Label>
                <Label className="flex items-center space-x-1 mb-0">
                  <RadioGroupItem value="no" />
                  <span>Non</span>
                </Label>
              </RadioGroup>
            </div> */}

            <div>
              <Label className="mb-2 text-gray-500">Tou est payé</Label>
              <RadioGroup className="flex" value={filters.is_paid} onValueChange={(value) => setFilters({ ...filters, is_paid: value })}>
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
              <Label className="mb-2 text-gray-500">Moulage positif</Label>
              <RadioGroup className="flex" value={filters.is_positive_molding} onValueChange={(value) => setFilters({ ...filters, is_positive_molding: value })}>
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

          <Button size="icon" onClick={() => setFilters({
            name: "",
            is_instance: null,
            is_paid: null,
            is_positive_molding: null
          })}>
            <FilterX />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none flex flex-col flex-1 overflow-hidden">
        <CardContent className="h-full overflow-y-auto py-6">
          {evenetsList.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Statut atelier</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>téléphone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Médecin</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead title="Tout est payé">Payé</TableHead>
                  <TableHead><User size={20} /></TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evenetsList.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="py-3 w-0">
                      <Dropdown
                        placeholder="Non envoyée"
                        options={workshopStatusOptions}
                        value={appointment.workshop_status || "not_sent"}
                        onChange={({ id }) => onWorkshopStatusChange(id, appointment)}
                        clearable
                        searchable={false}
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
                    <TableCell className="py-3 font-bold">{appointment.patient_name}</TableCell>
                    <TableCell className="py-3">{appointment.patient_phone}</TableCell>
                    <TableCell className="py-3">
                      {
                        (appointment.status == "instance" || appointment.date) &&
                        <Badge className={clsx("appointment-status-badge justify-center min-w-[116px]", getStatusBackground(appointment.status), { molding: appointment.positif_molding, absent: appointment.absent, done: appointment.status != "active" && appointment.status != "instance" })}>
                          {
                            appointment.status == "instance" ?
                              "En instance"
                              :
                              <span>
                                <span className="capitalize">{format(appointment.date, "dd MMM")}</span>
                                <span>{format(appointment.date, " à HH:mm")}</span>
                              </span>
                          }
                        </Badge>
                      }
                    </TableCell>
                    <TableCell className="py-3">{appointment.doctor_name || "----"}</TableCell>
                    <TableCell className="py-3">{appointment.price} DH</TableCell>
                    <TableCell className="py-3">
                      <Badge variant={appointment.paid ? "success" : "secondary"}>{appointment.paid ? "Oui" : "Non"}</Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <HoverCard>
                        <HoverCardTrigger>
                          <span className="cursor-pointer hover:text-green-700">{appointment.updated_by || appointment.created_by}</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-42">
                          <Table className="w-full bg-white rounded-lg">
                            <TableBody>
                              {
                                appointment.created_by &&
                                <TableRow>
                                  <TableCell className="py-3 font-bold text-nowrap align-top">Créé par</TableCell>
                                  <TableCell className="py-3 text-nowrap align-top">
                                    {appointment.created_by}
                                    <small className="block">le {format(appointment.created_at, "dd/MM/y à HH:mm:ss")}</small>
                                  </TableCell>
                                </TableRow>
                              }
                              {
                                appointment.updated_by &&
                                <TableRow>
                                  <TableCell className="py-3 font-bold text-nowrap align-top">Modifié par</TableCell>
                                  <TableCell className="py-3 text-nowrap align-top">
                                    {appointment.updated_by}
                                    <small className="block">le {format(appointment.updated_at, "dd/MM/y à HH:mm:ss")}</small>
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
                        <Button size="sm" variant="outline" className="h-auto p-2" onClick={() => openDialog(appointment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-auto p-2" onClick={() => onAppointmentPrint(appointment)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Pas de rendez-vous trouvé!</p>
          )}
        </CardContent>
      </Card>

      {/* Appointment Dialog */}
      <AppointmentModal
        data={formData}
        evenetsList={evenetsList}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        validationCallback={fetchEvents} />

      <PrinterDrawer
        isOpen={isPrintDrawerOpen}
        setIsOpen={setIsPrintDrawerOpen}
        data={printContent}
        title="Fiche du rendez-vous"
        rectoVerso
      />
    </div>
  );
};

export default AppointmentsPage;
