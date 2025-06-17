import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import Toolbar from "@/components/toolbar";
import axios from "axios";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, FileSpreadsheet, FilterX, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printInvoice, printTransactions } from "@/print";
import { NumberToLetter } from "convertir-nombre-lettre";
import Permission from "@/components/permission";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getStatusBackground, getStatusBackgroundOnly, getStatusOptions } from "@/functions";
import clsx from "clsx";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RangePicker from "@/components/rangepicker";
import PrinterDrawer from "@/components/print-drawer";
import { Input } from "@/components/ui/input";
import Dropdown from "@/components/dropdown";
import TablePagination from "@/components/table-pagination";
import AppointmentLegend from "@/components/appointments-legend";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const statusOptions = getStatusOptions();

const CashRegister = () => {
    const [transactionsList, setTransactionsList] = useState([]);
    const [transationsTotals, setTransactionsTotals] = useState({});
    const [hideAmounts, setHideAmounts] = useState(true);
    const [isPrintDrawerOpen, setIsPrintDrawerOpen] = useState(false);
    const [printContent, setPrintContent] = useState(null);
    const [printTitle, setPrintTitle] = useState(null);
    const [isRectoVerso, setIsRectoVerso] = useState(null);
    const [printExtraData, setPrintExtraData] = useState(null);
    const [mutualsList, setMutualsList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [filters, setFilters] = useState({
        name: "",
    });
    const activePageRef = useRef(1);
    const [pagination, setPagination] = useState({
        pagesNumber: 0,
        activePage: 1
    });
    const printInfos = useRef({});

    useEffect(() => {
        fetchMutualsList();
        fetchServicesList();
        fetchPrintInfos();
    }, []);

    useEffect(() => {
        activePageRef.current = 1;
        setPagination({ ...pagination, activePage: 1 });
        fetchTransactions();
    }, [filters]);

    const fetchMutualsList = async () => {
        const resp = await axios.get("/mutuals");
        setMutualsList(resp);
    };

    const fetchServicesList = async () => {
        const resp = await axios.get("/services");
        setServicesList(resp);
    };

    const fetchTransactions = async () => {
        const resp = await axios.get("/appointments/payments", {
            params: {
                ...filters,
                daterange: {
                    from: filters.daterange?.from && format(filters.daterange.from, "yyyy-MM-dd 00:00:00"),
                    to: filters.daterange?.to && format(filters.daterange.to, "yyyy-MM-dd 23:59:59"),
                },
                page: activePageRef.current,
            },
        });
        setTransactionsList(resp.data);
        setTransactionsTotals(resp.totals);
        setPagination({
            pagesNumber: resp.pagesNumber,
            activePage: resp.activePage
        });
    };

    const fetchPrintInfos = async () => {
        const resp = await axios.get("/settings");
        printInfos.current = resp;
    }

    const onPrintRequested = async (transaction, isQuote) => {
        let invoiceNumResp = null;
        try {
            invoiceNumResp = await axios.get(`/appointments/${transaction.id}/payments/${isQuote ? "quote" : "invoice"}`);
        } catch (error) {
            console.error("Error fetching invoice number:", error);
        }

        const date = format((isQuote ? transaction.quote_date : transaction.invoice_date) || new Date(), "dd/MM/yyyy");
        const html = printInvoice({
            ...printInfos.current,
            invoice_date: date,
            patient_name: transaction.name,
            doctor_name: transaction.doctor,
            invoice_number: invoiceNumResp?.num,
            price: transaction.price,
            price_letters: NumberToLetter(transaction.price),
            service: transaction.service
        }, isQuote);
        setPrintContent(html);
        setPrintTitle(isQuote ? "Devis" : "Facture");
        setPrintExtraData({
            id: transaction.id,
            type: isQuote ? "quote" : "invoice",
            ...invoiceNumResp,
            service: transaction.service,
            date
        });
        setIsPrintDrawerOpen(true);
        setIsRectoVerso(null);
        document.body.style.pointerEvents = "auto";
    };

    const onTransactionsPrint = async () => {
        const start = filters.daterange?.from ? format(filters.daterange.from, "dd/MM/yyyy") : "";
        const end = filters.daterange?.to ? format(filters.daterange.to, "dd/MM/yyyy") : "";

        let payments = await axios.get("/appointments/payments/all", {
            params: {
                ...filters,
                daterange: {
                    from: filters.daterange?.from && format(filters.daterange.from, "yyyy-MM-dd 00:00:00"),
                    to: filters.daterange?.to && format(filters.daterange.to, "yyyy-MM-dd 23:59:59"),
                },
            },
        });

        const html = printTransactions(
            {
                start,
                end: !end || start == end ? "" : end,
            },
            payments,
            payments.reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0).toFixed(2),
        )
        setPrintContent(html);
        setPrintTitle("Liste des règlements");
        setIsRectoVerso(false);
        setIsPrintDrawerOpen(true);
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <Toolbar
                title="Réglements"
                afterSearch={
                    <Permission name="payments_totals">
                        <div className="flex items-center space-x-2 select-none" onMouseDown={() => setHideAmounts(false)} onMouseUp={() => setHideAmounts(true)}>
                            <div className={clsx("flex items-center space-x-3 bg-green-100 text-green-700 p-2.5 rounded-lg", { "cursor-pointer": hideAmounts, "cursor-none": !hideAmounts })}>
                                <ArrowUp className="w-4 h-4" />
                                <p className="text-sm">Total ({transationsTotals.countPayments})</p>
                                {
                                    hideAmounts ?
                                        <p className="text-md font-bold">*****.**</p>
                                        :
                                        <p className="text-md font-bold">{transationsTotals.totalPayments}</p>
                                }
                            </div>
                            <div className={clsx("flex items-center space-x-3 bg-orange-100 text-orange-700 p-2.5 rounded-lg", { "cursor-pointer": hideAmounts, "cursor-none": !hideAmounts })}>
                                <ArrowDown className="w-4 h-4" />
                                <p className="text-sm">Reste ({transationsTotals.countReste})</p>
                                {
                                    hideAmounts ?
                                        <p className="text-md font-bold">*****.**</p>
                                        :
                                        <p className="text-md font-bold">{transationsTotals.totalReste}</p>
                                }
                            </div>
                        </div>
                    </Permission>
                }>
                {
                    transactionsList.length > 0 &&
                    <Button onClick={onTransactionsPrint} className="ml-2" variant="secondary">
                        <Printer className="mr-1 !w-5 !h-5" /> Imprimer
                    </Button>
                }
                {/* <AppointmentLegend /> */}
            </Toolbar>

            {/* Filters */}
            <Card className="border-none">
                <CardContent className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] space-x-6 py-4">
                    <div>
                        <RangePicker placeholder="Filtrer par date de création" value={filters.daterange} onChange={daterange => setFilters({ ...filters, daterange })} clearable />
                    </div>
                    <div>
                        <Input placeholder="Nom ou téléphone" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
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
                            placeholder="Prestation"
                            options={servicesList}
                            value={filters.service}
                            onChange={({ id }) => setFilters({ ...filters, service: id })}
                            clearable />
                    </div>

                    <div>
                        <Label className="mb-2 text-gray-500">Facturé</Label>
                        <RadioGroup className="flex" value={filters.billed} onValueChange={(value) => setFilters({ ...filters, billed: value })}>
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

                    <Button size="icon" onClick={() => {
                        setFilters({
                            name: "",
                            billed: null
                        })
                    }}>
                        <FilterX />
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-none flex flex-col flex-1 overflow-hidden">
                <CardContent className="h-full flex flex-col space-y-3 py-6">
                    <div className="overflow-y-auto flex-1">
                        {transactionsList.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Mutuelle</TableHead>
                                        <TableHead>Rendez-vous</TableHead>
                                        <TableHead>Prestation</TableHead>
                                        <TableHead className="w-0">Prix</TableHead>
                                        <TableHead className="w-0">Payé</TableHead>
                                        <TableHead className="w-0">Reste</TableHead>
                                        <TableHead className="w-0"></TableHead>
                                        <Permission name="payments_print">
                                            <TableHead></TableHead>
                                        </Permission>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsList.map((transaction, index) => (
                                        <TableRow key={index} className={clsx("hover:bg-transparent", { "opacity-50": transaction.status == "cancelled", "!bg-green-50": transaction.reste == 0 && transaction.status != "cancelled", "!bg-orange-50": transaction.reste != 0 && transaction.status != "cancelled" })}>
                                            <TableCell className="py-3 font-bold">{transaction.name}</TableCell>
                                            <TableCell className="py-3"><small>{transaction.mutual}</small></TableCell>
                                            <TableCell className="py-3">
                                                {
                                                    (transaction.status == "instance" || transaction.date) &&
                                                    <Badge className={clsx("appointment-status-badge justify-center min-w-[116px]", getStatusBackground(transaction.status), { molding: transaction.positif_molding, absent: transaction.absent, done: transaction.status != "active" && transaction.status != "instance" })}>
                                                        {
                                                            transaction.status == "instance"
                                                                ? "En instance"
                                                                :
                                                                <span>
                                                                    <span className="capitalize">{format(transaction.date, "dd MMM")}</span>
                                                                    <span>{format(transaction.date, " à HH:mm")}</span>
                                                                </span>
                                                        }
                                                    </Badge>
                                                }
                                            </TableCell>
                                            <TableCell className="py-3"><small>{transaction.service}</small></TableCell>
                                            <TableCell className="py-3 w-0 font-bold text-nowrap">{transaction.price} DH</TableCell>
                                            <TableCell className="py-3 w-0 text-nowrap">
                                                <HoverCard>
                                                    <HoverCardTrigger>
                                                        <span className={clsx({ "font-bold cursor-pointer hover:text-green-700": transaction.advance != 0, "text-gray-500": transaction.advance == 0 })}>{transaction.status == "cancelled" && transaction.advance != 0 && "-"}{transaction.advance} DH</span>
                                                    </HoverCardTrigger>
                                                    {
                                                        transaction.payments.length > 0 &&
                                                        <HoverCardContent className="w-sm">
                                                            <Table className="w-full bg-white rounded-lg">
                                                                <TableHeader className="text-gray-500">
                                                                    <TableRow>
                                                                        <TableCell className="py-3">Montant</TableCell>
                                                                        <TableCell className="py-3">Date</TableCell>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {
                                                                        transaction.payments.map((payment, index) => (
                                                                            <TableRow key={index}>
                                                                                <TableCell className="py-3 font-bold">{payment.amount}</TableCell>
                                                                                <TableCell className="py-3 text-nowrap text-xs">{format(payment.date, "dd/MM/y à HH:mm")}</TableCell>
                                                                            </TableRow>
                                                                        ))
                                                                    }
                                                                </TableBody>
                                                            </Table>
                                                        </HoverCardContent>
                                                    }
                                                </HoverCard>
                                            </TableCell>
                                            <TableCell className={`py-3 w-0 font-bold text-nowrap ${transaction.reste == 0 && transaction.status != "cancelled" ? "bg-green-100 text-green-700" : transaction.status != "cancelled" ? "bg-orange-100 text-orange-700" : ""}`}>
                                                {transaction.reste} DH
                                            </TableCell>
                                            <TableCell className="py-0 pr-0 w-0 text-nowrap">
                                                {transaction.invoice_num && <small className="block">FA-{transaction.invoice_num}</small>}
                                                {transaction.quote_num && <small className="block">DE-{transaction.quote_num}</small>}
                                            </TableCell>
                                            <Permission name="payments_print">
                                                <TableCell className="py-3 text-center">
                                                    {
                                                        transaction.status != "cancelled" && !transaction.is_service_billable ?
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Button disabled={true} size="sm" variant="outline" className="h-auto p-2">
                                                                            <Printer className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="max-w-32">
                                                                        Ce service n'est pas facturable
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            :
                                                            transaction.status != "cancelled" && !transaction.mutual ?
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Button disabled={true} size="sm" variant="outline" className="h-auto p-2">
                                                                                <Printer className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-32">
                                                                            Veuillez choisir une mutuelle
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                :
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button disabled={transaction.status == "cancelled"} size="sm" variant="outline" className="h-auto p-2">
                                                                            <Printer className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-56">
                                                                        <DropdownMenuLabel>Impression</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuGroup>
                                                                            <DropdownMenuItem onClick={() => onPrintRequested(transaction, false)}>
                                                                                <FileSpreadsheet />
                                                                                <span>Imprimer la Facture</span>
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => onPrintRequested(transaction, true)}>
                                                                                <FileSpreadsheet />
                                                                                <span>Imprimer le Devis</span>
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuGroup>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                    }
                                                </TableCell>
                                            </Permission>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p>Aucune transaction trouvée.</p>
                        )}
                    </div>

                    <TablePagination pagesNumber={pagination.pagesNumber} activePage={pagination.activePage} setActivePage={(page) => {
                        activePageRef.current = page;
                        setPagination({ ...pagination, activePage: page });
                        fetchTransactions();
                    }} />
                </CardContent>
            </Card>

            <PrinterDrawer
                isOpen={isPrintDrawerOpen}
                setIsOpen={setIsPrintDrawerOpen}
                data={printContent}
                title={printTitle}
                rectoVerso={isRectoVerso}
                extraData={printExtraData}
                closed={() => {
                    setPrintExtraData(null);
                }}
                onRefreshRequested={fetchTransactions}
            />
        </div>
    );
};

export default CashRegister;