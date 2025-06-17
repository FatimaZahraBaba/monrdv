import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import frLocale from 'date-fns/locale/fr'
import Toolbar from "@/components/toolbar";
import AppointmentLegend from "@/components/appointments-legend";
import { endOfMonth, endOfWeek, startOfMonth } from "date-fns";
import axios from "axios";
import AppointmentModal from "@/components/appointment-modal";
import RolesContext from "@/context/roles-context";
import { ArrowLeftToLine, ArrowRightToLine, Check, Info, List, Notebook, Printer, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { getStatusBackground, getWorkshopStatusBackground, getWorkshopStatusBackgroundOnly, getWorkshopStatusOptions, getWorkshopStatusText } from "@/functions";
import ConfirmDialog from "@/components/confirm-dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { createPortal } from "react-dom";
import { Switch } from "@/components/ui/switch";
import { useSocket } from "@/context/socket-context";
import NotesModal from "@/components/notes-modal";
import { printAppointment } from "@/print";
import PrinterDrawer from "@/components/print-drawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Dropdown from "@/components/dropdown";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'fr': frLocale },
})

const DnDCalendar = withDragAndDrop(Calendar);

const workshopStatusOptions = getWorkshopStatusOptions();

const AppointmentsCalendarPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const { checkRole } = useContext(RolesContext);
  const [formData, setFormData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [evenetsList, setEventsList] = useState([]);
  const [instanceEventsList, setInstanceEventsList] = useState([]);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [showTime, setShowTime] = useState(true);
  const [isDayView, setIsDayView] = useState(false);
  const [isPrintDrawerOpen, setIsPrintDrawerOpen] = useState(false);
  const [printContent, setPrintContent] = useState(null);
  const dateRange = useRef({
    start_date: startOfWeek(startOfMonth(new Date()), { weekStartsOn: 1 }),
    end_date: endOfWeek(endOfMonth(new Date()), { weekStartsOn: 1 })
  });
  const confirmDialog = useRef();

  useEffect(() => {
    fetchEvents();

    socket.on("appointments", (data) => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.id != data.user) {
        fetchEvents();
      }
    })

    return () => {
      socket.off?.("appointments");
    }
  }, [])

  const fetchEvents = async () => {
    const resp = await axios.get("/appointments", {
      params: {
        daterange: {
          from: format(dateRange.current.start_date, "yyyy-MM-dd 00:00:00"),
          to: format(dateRange.current.end_date, "yyyy-MM-dd 23:59:59")
        }
      }
    });

    // const date = new Date();
    // date.setHours(0, 0, 0, 0);
    // setEventsList(events => [...events, { patient_name: 'Test', start: date, end: date, date: date }])

    setInstanceEventsList(resp.filter(event => event.status === "instance"));

    const notesResp = await axios.get("/notes", {
      params: {
        from: format(dateRange.current.start_date, "yyyy-MM-dd 00:00:00"),
        to: format(dateRange.current.end_date, "yyyy-MM-dd 23:59:59")
      }
    });

    setEventsList([
      ...resp.map((event) => {
        return {
          ...event,
          start: event.date && new Date(event.date),
          end: event.date && new Date(new Date(event.date).getTime() + 30 * 60000),
          isDraggable: true,
        }
      }),
      ...notesResp.map((event) => {
        return {
          ...event,
          end: event.date && new Date(event.date),
          start: event.date && new Date(event.date),
          isNote: true,
          isDraggable: false
        }
      })
    ]);
  }

  const handleSelectEvent = (event) => {
    setFormData({ ...event });
    if (event.title) {
      setIsNoteDialogOpen(true);
    }
    else {
      setIsDialogOpen(true);
    }
  };

  // Handle date selection (opens the dialog)
  const handleSelectSlot = (slotInfo) => {
    if (!checkRole("appointments_create")) return;
    if (slotInfo.action != "doubleClick") return;

    if (slotInfo.box) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (slotInfo.start < today) return;
      setFormData({
        date: slotInfo.start,
      });
      setIsDialogOpen(true);
    } else {
      setFormData({
        date: slotInfo.start,
      });
      setIsNoteDialogOpen(true);
    }

  };

  const removeDragPreview = useCallback(() => {
    if (showTime) {
      document.querySelector(".rbc-addons-dnd-drag-preview").remove();
    }
    else {
      document.querySelector(".rbc-addons-dnd-drag-preview").style.top = "-1000px";
    }
  }, [showTime]);

  const handleDragAndDrop = useCallback((dragInfo) => {
    const { start, end, event } = dragInfo;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      setDraggedEvent(null);
      removeDragPreview();
      return;
    };

    if (!event && draggedEvent && draggedEvent.status === "instance") {
      handleSelectEvent({
        ...draggedEvent,
        date: start
      });
      setDraggedEvent(null);
      removeDragPreview();
      return;
    }

    const data = {
      ...event,
      date: format(start, "yyyy-MM-dd HH:mm:ss"),
      start,
      end
    };

    setEventsList(evenetsList.map(e => e.id === event.id ? data : e));

    confirmDialog.current.show({
      title: "Déplacer le rendez-vous",
      message: "Voulez-vous vraiment déplacer ce rendez-vous ?",
      onConfirm: async () => {
        try {
          if (event.isNote) {
            await axios.put(`/notes/${event.id}`, data);
          }
          else {
            await axios.put(`/appointments/${event.id}`, data)
          }
        }
        finally {
          fetchEvents();
        }
      },
      onCancel: () => {
        fetchEvents();
      }
    });
  }, [evenetsList, draggedEvent]);

  const onAbsentChanged = useCallback(async (event, checked) => {
    try {
      await axios.put(`/appointments/${event.id}/absent`, {
        absent: checked
      })
    }
    finally {
      fetchEvents();
    }
  }, []);

  const onAppointmentPrint = useCallback((data) => {
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
  }, []);

  const onNoteDelete = useCallback(async (e) => {
    confirmDialog.current.show({
      title: "Supprimer la note",
      message: "Voulez-vous vraiment supprimer cette note ?",
      onConfirm: async () => {
        try {
          await axios.delete(`/notes/${e.target.dataset.id}`);
        }
        finally {
          fetchEvents();
        }
      }
    });
  }, []);

  const onNoteDone = useCallback(async (id, done) => {
    try {
      await axios.put(`/notes/${id}/done`, {
        done
      });
    }
    finally {
      fetchEvents();
    }
  }, []);

  const onWorkshopStatusChange = async (status, appointment) => {
    try {
      await axios.put(`/appointments/${appointment.id}/workshop`, { status });
    }
    finally {
      fetchEvents();
    }
  }

  const dragFromOutsideItem = useCallback(() => draggedEvent, [draggedEvent])

  const EventWrapper = useCallback(({ event }) => {
    return (
      <HoverCard openDelay={500}>
        <HoverCardTrigger asChild>
          {
            event.isNote ? (
              <div className="h-full flex items-center space-x-1">
                {
                  event.done ?
                    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-white">
                      <Check size={13} color={event.color} />
                    </span>
                    :
                    <Notebook size={16} className="flex-shrink-0" />
                }
                <span className="flex-grow line-clamp-1">{event.title}</span>
              </div>
            ) : (
              <div className="h-full flex items-center justify-between">
                {showTime ? format(event.date, "HH:mm") : ''}{showTime ? ' - ' : ''}{event.patient_name}
                <div className="flex items-center space-x-2">
                  {
                    isDayView && event.workshop_status && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className={clsx("flex items-center justify-center text-white w-5 h-5 rounded-sm", getWorkshopStatusBackgroundOnly(event.workshop_status))}>
                            {
                              event.workshop_status == "sent" ?
                                <ArrowRightToLine size={15} className="flex-shrink-0" />
                                :
                                <ArrowLeftToLine size={15} className="flex-shrink-0" />
                            }
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            { getWorkshopStatusText(event.workshop_status) }
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }
                  {
                    isDayView && event.patient_note && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex ml-2">
                            <Info size={19} />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {event.patient_note}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }
                </div>
              </div>
            )
          }
        </HoverCardTrigger>
        {
          createPortal(
            event.isNote ?
              <HoverCardContent className="w-96 p-0 overflow-hidden">
                <h3 className="font-bold text-md line-clamp-1 px-5 py-3 text-white" style={{ backgroundColor: event.color }}>{event.title}</h3>
                <div className="px-5 pb-4">
                  <p className="text-sm py-4">{event.description || 'Pas de description'}</p>
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch checked={event.done} onCheckedChange={checked => onNoteDone(event.id, checked)} />
                      <span className="font-semibold text-sm">Action réalisée</span>
                    </div>
                    <Button size="icon" className="flex-shrink-0 w-8 h-8 bg-red-700" data-id={event.id} onClick={onNoteDelete}><Trash2 /></Button>
                  </div>
                </div>
              </HoverCardContent>
              :
              <HoverCardContent className="w-96 p-0 overflow-hidden">
                <div className={clsx("flex items-center space-x-2 mb-2 p-3 py-2.5", getStatusBackground(event.status))}>
                  <div className={clsx("flex items-center justify-between flex-grow space-x-3")}>
                    <span className="font-bold text-md line-clamp-1 font-secondary">{event.patient_name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-red-600">Absent</span>
                      <Switch checked={event.absent} onCheckedChange={(checked) => onAbsentChanged(event, checked)} />
                    </div>
                  </div>

                  <Button size="icon" onClick={() => onAppointmentPrint(event)}>
                    <Printer />
                  </Button>
                </div>
                <div className="px-5 pb-2">
                  <Table className="w-full bg-white rounded-lg">
                    <TableBody>
                      <TableRow className="hover:bg-white">
                        <TableCell className="py-3 px-0 w-0 text-nowrap align-top">Téléphone</TableCell>
                        <TableCell className="py-3 pr-0 font-semibold align-top text-right">{event.patient_phone}{event.patient_phone2 && ' / '}{event.patient_phone2}</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-white border-0">
                        <TableCell className="py-3 px-0 w-0 text-nowrap align-top">Adresse</TableCell>
                        <TableCell className="py-3 pr-0 font-semibold align-top text-right">{event.patient_address}</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-white">
                        <TableCell className="py-3 px-0 w-0 align-top" colSpan={2}>
                          <div className="flex flex-grow space-x-3 p-3 py-2.5 rounded-lg bg-gray-100 text-gray-500">
                            <Info size={19} className="flex-shrink-0 text-gray-500" />
                            <span className="flex-grow">{event.patient_note || 'Pas de remarque'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-white border-0">
                        <TableCell className="py-3 px-0" colSpan={2}>
                          <div className="flex items-center justify-between space-x-2">
                            <span className="flex-grow">Statut atelier</span>
                            <Dropdown
                              placeholder="Non envoyée"
                              options={workshopStatusOptions}
                              value={event.workshop_status || "not_sent"}
                              onChange={({ id }) => onWorkshopStatusChange(id, event)}
                              clearable
                              searchable={false}
                              simple
                              triggerClass={value => getWorkshopStatusBackground(value) + " w-auto"}
                              renderItem={(item) => (
                                <div className="flex items-center">
                                  <span className={clsx("block w-2 h-2 mr-2 rounded", getWorkshopStatusBackgroundOnly(item.id))}></span>
                                  {item.name}
                                </div>
                              )}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </HoverCardContent>
            , document.body)
        }
      </HoverCard>
    );
  }, [showTime, isDayView]);

  return (
    <div className="flex flex-col space-y-4 flex-grow overflow-hidden">
      { /* Toolbar Card */}
      <Toolbar title="Gestion des rendez-vous" afterSearch={
        <Button onClick={() => navigate("/appointments")} className="ml-2" variant="default">
          <List size={16} />
        </Button>
      }>
        <AppointmentLegend />
      </Toolbar>

      {/* Calendar Card */}
      <Card className="border-none flex-grow flex flex-col overflow-hidden">
        <CardContent className="p-6 py-6 flex-grow overflow-hidden flex flex-col">
          <div className="calendar-instance-items">
            {instanceEventsList.map((event, index) => (
              <div
                key={index}
                draggable
                className={clsx("py-1 px-3", getStatusBackground(event.status), { molding: event.positif_molding })}
                onDragStart={() => setDraggedEvent({
                  ...event,
                  date: new Date(event.date),
                  start: new Date(event.date),
                  end: new Date(new Date(event.date).getTime() + 30 * 60000),
                })}>
                <span>{event.patient_name}</span>
                <small>({format(event.created_at, "dd/MM/y")})</small>
              </div>
            ))}
          </div>

          <DnDCalendar
            localizer={localizer}
            culture="fr"
            events={evenetsList.filter(event => !showTime ? true : !event.isNote)}
            tooltipAccessor=""
            timeslots={1}
            min={new Date(0, 0, 0, 8, 0)}
            max={new Date(0, 0, 0, 21, 30)}
            resizable={false}
            selectable
            onSelectSlot={handleSelectSlot}
            onDoubleClickEvent={handleSelectEvent}
            onEventDrop={handleDragAndDrop}
            onDropFromOutside={handleDragAndDrop}
            dragFromOutsideItem={dragFromOutsideItem}
            draggableAccessor="isDraggable"
            onRangeChange={range => {
              if (Array.isArray(range))
                dateRange.current = { start_date: range[0], end_date: range[range.length - 1] }
              else
                dateRange.current = { start_date: range.start, end_date: range.end }
              fetchEvents();
            }}
            formats={{
              eventTimeRangeFormat: () => ""
            }}
            onView={view => {
              setShowTime(view === "month")
              setIsDayView(view === "day");
            }}
            views={["month", "week", "day"]}
            messages={{
              today: "Aujourd'hui",
              previous: "❮ Précédent",
              next: "Suivant ❯",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              date: "Date",
              time: "Heure",
              event: "Événement",
              noEventsInRange: "Aucun rendez-vous prévu",
              showMore: total => `+ ${total} de plus`
            }}
            //style={{ height: 500 }}
            eventPropGetter={(event) => ({
              className: clsx(getStatusBackground(event.status), { molding: event.positif_molding, absent: event.absent, done: event.status != "active" && event.status != "instance" }),
              style: {
                backgroundColor: event.isNote ? event.color : null,
                color: event.isNote ? "#fff" : null,
                opacity: event.done ? 0.5 : 1,
              }
            })}
            components={{
              event: EventWrapper,
            }}
          />
        </CardContent>
      </Card>

      {/* Appointment Dialog */}
      <AppointmentModal
        data={formData}
        evenetsList={evenetsList}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        validationCallback={fetchEvents} />

      <ConfirmDialog ref={confirmDialog} />

      <NotesModal
        data={formData}
        isDialogOpen={isNoteDialogOpen}
        setIsDialogOpen={setIsNoteDialogOpen}
        validationCallback={fetchEvents}
      />

      <PrinterDrawer
        isOpen={isPrintDrawerOpen}
        setIsOpen={setIsPrintDrawerOpen}
        data={printContent}
        title="Fiche du rendez-vous"
        rectoVerso />
    </div>
  );
};

export default AppointmentsCalendarPage;
