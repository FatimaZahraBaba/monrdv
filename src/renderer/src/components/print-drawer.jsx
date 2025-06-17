const { ipcRenderer } = window.electron || {};
import React, { useEffect, useRef, useState } from "react"
import { Drawer } from 'vaul';
import { Button } from "./ui/button"
import { Switch } from "./ui/switch";
import { Printer } from "lucide-react";
import axios from "axios";
import { format, isValid, parse } from "date-fns";

function PrinterDrawer({ isOpen, setIsOpen, data, title, rectoVerso = null, extraData = {}, closed = () => { }, onRefreshRequested = () => { } }) {
    const [isRectoVerso, setIsRectoVerso] = useState(rectoVerso);
    const [printDisabled, setPrintDisabled] = useState(false);
    const changedInvoiceNum = useRef(extraData?.num);
    const changedServiceName = useRef(extraData?.service);
    const changedInvoiceDate = useRef(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        const handleIframeMessage = (event) => {
            if (event.data?.type === 'invoice-number-changed') {
                changedInvoiceNum.current = event.data.num;
            }
            else if (event.data?.type === 'service-name-changed') {
                changedServiceName.current = event.data.name;
            }
            else if (event.data?.type === 'invoice-date-changed') {
                const date = parse(event.data.date, 'dd/MM/yyyy', new Date());
                if (!isValid(date)) {
                    changedInvoiceDate.current = null;
                    iframeRef.current.contentWindow.postMessage({ action: 'reload' }, '*');
                    return;
                }

                changedInvoiceDate.current = event.data.date;
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, []);

    useEffect(() => {
        changedInvoiceNum.current = extraData?.num;
        changedServiceName.current = extraData?.service;
        changedInvoiceDate.current = null;
    }, [extraData])

    useEffect(() => {
        setIsRectoVerso(rectoVerso);
    }, [rectoVerso])

    const onPrint = async () => {
        let printContent = data;
        const parser = new DOMParser();
        const html = parser.parseFromString(data, 'text/html');

        setPrintDisabled(true);
        try {
            const { id, type, num, exists } = extraData;
            if ((!exists || changedInvoiceNum.current != extraData?.num) && id && type && num) {
                await axios.put(`/appointments/${id}/payments/${type}`, {
                    num: changedInvoiceNum.current || num,
                    isChanged: changedInvoiceNum.current != extraData?.num
                });
                const invoiceNumberElement = html.querySelector('#invoice-number');
                if (invoiceNumberElement) {
                    invoiceNumberElement.textContent = changedInvoiceNum.current || num;
                }
                printContent = html.documentElement.outerHTML;
                onRefreshRequested();
            }

            if (changedServiceName.current && changedServiceName.current !== extraData?.service) {
                await axios.put(`/appointments/${id}/invoice`, {
                    service: changedServiceName.current,
                });
                const serviceNameElement = html.querySelector('#service-name');
                if (serviceNameElement) {
                    serviceNameElement.textContent = changedServiceName.current;
                }
                printContent = html.documentElement.outerHTML;
                onRefreshRequested();
            }

            const date = changedInvoiceDate.current || extraData?.date;
            if (date && extraData?.type) {
                await axios.put(`/appointments/${id}/invoice`, {
                    [`${extraData.type}_date`]: format(parse(date, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
                });
                const invoiceDateElement = html.querySelector('#invoice-date');
                if (invoiceDateElement) {
                    invoiceDateElement.textContent = date;
                }
                printContent = html.documentElement.outerHTML;
                onRefreshRequested();
            }
        }
        catch (error) {
            console.error("Error saving num:", error);
        }
        ipcRenderer.send("silent-print", { content: printContent, rectoVerso: isRectoVerso });
        setTimeout(() => {
            setPrintDisabled(false);
        }, 5000);
    }

    return (
        <Drawer.Root direction="right" open={isOpen} onOpenChange={isOpen => {
            setIsOpen(isOpen);
            setIsRectoVerso(rectoVerso);

            if (!isOpen) {
                closed();
            }
        }}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="right-2 top-2 bottom-2 fixed z-50 outline-none w-auto flex">
                    <div className="bg-gray-200 h-full w-full grow p-5 flex flex-col rounded-[16px]">
                        <div className="flex items-center justify-between mb-4">
                            <Drawer.Title className="font-bold text-xl">{title}</Drawer.Title>
                            <div className="flex items-center space-x-4">
                                {
                                    //rectoVerso !== null &&
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            className="data-[state=unchecked]:bg-gray-400 data-[state=checked]:bg-primary"
                                            checked={isRectoVerso}
                                            onCheckedChange={setIsRectoVerso} />
                                        <span className="font-semibold text-sm">Recto / Verso</span>
                                    </div>
                                }
                                <Button onClick={onPrint} disabled={printDisabled}>
                                    <Printer /> Imprimer
                                </Button>
                            </div>
                        </div>

                        {
                            data &&
                            <div className="iframe-container relative h-full" style={{ aspectRatio: 1 / 1.4142 }}>
                                <iframe
                                    ref={iframeRef}
                                    className="absolute inset-0 w-full h-full border-none"
                                    src={`data:text/html,${encodeURIComponent(data)}`} />
                            </div>
                        }
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}

export default PrinterDrawer