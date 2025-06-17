import Logo from "./print-logo";
import printFontAr from "./print-font-ar";
import printFontFr from "./print-font-fr";
import { format } from "date-fns";

export const printAppointment = (data) => {
    const htmlContent = `
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    ${printFontAr}
                    ${printFontFr}

                    @page {
                        size: A4;
                        margin: 0;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Figtree, sans-serif;
                        font-size: 9pt;
                        line-height: 1.4;
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                    }

                    ::-webkit-scrollbar {
                        display: none;
                    }

                    .page {
                        page-break-after: always;
                        position: relative;
                        background-color: #fff;
                        border-radius: 10pt;
                        margin-bottom: 5mm;
                        height: 100%;
                    }

                    @media print {
                        .page {
                            margin-bottom: 0;
                            border-radius: 0;
                        }
                    }

                    .top-left-card {
                        position: absolute;
                        top: 8mm;
                        left: 8mm;
                    }

                    .top-right-card {
                        position: absolute;
                        top: 8mm;
                        right: 8mm;
                    }

                    .bottom-right-card {
                        position: absolute;
                        bottom: 8mm;
                        right: 3mm;
                        padding: 0 10pt;

                        &::after {
                            content: "";
                            position: absolute;
                            top: -4mm;
                            left: -4mm;
                            right: 0;
                            bottom: 0;
                            border: 1pt dashed #000;
                            border-right: none;
                            border-bottom: none;
                        }
                    }

                    .notice {
                        position: absolute;
                        bottom: 5mm;
                        left: 4mm;
                        width: 45mm;
                        font-size: 8.5pt;
                        line-height: 1.5;
                        text-align: center;
                        padding-top: 4mm;
                        min-height: 60mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        gap: 5pt;
                    }

                    .notice p {
                        margin: 0;
                    }

                    .notice b {
                        font-size: 10pt;
                        font-weight: bold;
                    }

                    .info {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: 10pt;
                        padding: 6pt;
                        border-radius: 5pt;
                        margin-bottom: 5pt;
                        border: 2pt solid #000;
                    }

                    .bottom-right-card .info {
                        border-radius: 0;
                        padding: 10pt 0;
                        border: none;

                        &:not(:last-child) {
                            border-bottom: 2pt solid #000;
                        }
                    }

                    .info small,
                    .info b {
                        display: block;
                    }

                    .info small {
                        margin-bottom: 3pt;
                    }

                    .info.date b {
                        font-size: 11pt;
                    }

                    .print-date {
                        margin-bottom: 10pt;
                    }

                    .print-date small {
                        display: block;
                        font-weight: bold;
                        font-size: 80%;
                    }

                    .hidden {
                        display: none !important;
                    }

                    .foot-title {
                        position: absolute;
                        bottom: 5mm;
                        bottom: 15%;
                        font-size: 30pt;
                        font-weight: bold;
                        text-transform: uppercase;
                    }

                    .foot-title.left {
                        left: 10mm;
                    }

                    .foot-title.right {
                        right: 10mm;
                    }

                    @media screen {
                        .foot-title {
                            font-size: 24pt;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="top-left-card" style="opacity: ${data.patient_name && !data.appointment_date ? 1 : 0};">
                        <div class="info" style="min-width: 35mm">
                            <span>
                                <small>Patient :</small>
                                <b>${data.patient_name}</b>
                            </span>
                        </div>
                        <div class="info" style="width: 35mm">
                            <span class="${data.patient_phone || data.patient_phone2 ? '' : 'hidden'}">
                                <small>Tél :</small>
                                <b class="${data.patient_phone ? '' : 'hidden'}">${data.patient_phone}</b>
                                <b class="${data.patient_phone2 ? '' : 'hidden'}">${data.patient_phone2}</b>
                            </span>  
                            <span class="${data.patient_address ? '' : 'hidden'}">
                                <small>Adresse :</small>
                                <b>${data.patient_address}</b>
                            </span>
                        </div>
                    </div>
                    
                    <div class="top-right-card">
                        <div class="print-date" style="opacity: ${data.print_date ? 1 : 0}">
                            <small>Fait le :</small>
                            <span style="letter-spacing: 0.7pt">${data.print_date}</span>
                        </div>
                        <div class="info date" style="opacity: ${data.appointment_date ? 1 : 0}">
                            <span>
                                <small>Rendez-vous le :</small>
                                <b style="text-transform: capitalize;">${data.appointment_date?.dayName}</b>
                                <b style="letter-spacing: 0.7pt">${data.appointment_date?.date}</b>
                                <b>à ${data.appointment_date?.time}</b>
                            </span>
                        </div>
                        <div class="info" style="opacity: ${data.appointment_date ? 1 : 0}; gap: 5pt">
                            <span>
                                <small>Total :</small>
                                <b>${data.price} DH</b>
                            </span>
                            <span>
                                <small>Avance :</small>
                                <b>${data.advance} DH</b>
                            </span>
                            <span>
                                <small>Reste :</small>
                                <b>${data.reste} DH</b>
                            </span>
                        </div>
                    </div>

                    <div class="bottom-right-card" style="opacity: ${data.appointment_date ? 1 : 0}; min-width: 45mm">
                        <div class="info">
                            <span>
                                <small>Nom du patient :</small>
                                <b>${data.patient_name}</b>
                            </span>
                        </div>
                        <div class="info date">
                            <span>
                                <small>Prochain rendez-vous :</small>
                                <b style="text-transform: capitalize;">${data.appointment_date?.dayName} <span style="letter-spacing: 0.7pt">${data.appointment_date?.date}</span></b>
                                <b>à ${data.appointment_date?.time}</b>
                            </span>
                        </div>
                        <div class="info" style="flex-direction: row; justify-content: space-between; margin-bottom: 0;">
                            <span>
                                <small>Avance :</small>
                                <b>${data.advance} DH</b>
                            </span>
                            <span>
                                <small>Reste :</small>
                                <b>${data.reste} DH</b>
                            </span>
                        </div>
                    </div>

                    <div class="foot-title left ${data.appointment_date ? 'hidden' : ''}">G</div>
                </div>
                
                <div class="page">
                    <div class="notice ${!data.appointment_date ? 'hidden' : ''}">
                        <p><b>Important</b><br>
    En cas d’empêchement, merci d’annuler ou de reporter votre rendez-vous 24h à l’avance.
    Seuls les rendez-vous annulés à temps pourront être reprogrammés.</p>

                        <p style="direction: rtl; font-family: 'Noto Naskh Arabic'; font-size: 105%"><b>هام</b><br>
    في حال تعذّر الحضور، يُرجى إلغاء أو تأجيل الموعد قبل 24 ساعة على الأقل.
    فقط المواعيد التي تم إلغاؤها في الوقت المناسب يمكن إعادة برمجتها.</p>

                        <b style="font-size: 140%;">☎ 05 28 23 62 73</b>
                    </div>
                    <div class="foot-title right ${data.appointment_date ? 'hidden' : ''}">D</div>
                </div>
            </body>
        </html>
    `

    //ipcRenderer.send("silent-print", htmlContent);
    return htmlContent;
}

export const printInvoice = (data, isQuote) => {
    const htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                ${printFontFr}
                @page {size: A4; margin: 15mm;} * {box-sizing: border-box;} body {font-family: Figtree, sans-serif; margin: 2pt;} @media screen { body { zoom: 70%; height: 100%; overflow: hidden; } .page { padding: 8mm; background-color: #fff; border-radius: 10pt; height: 100%; } } .logo {width: 50%;} .address {font-weight: bold; line-height: 1.5; margin-bottom: 20pt;} .info-client {border: 1.98pt solid black; padding: 5pt; width: 80%; float: right;} .info-client table {width: 100%; font-weight: bold;} td.titre {font-size: 10.5pt;} td:not(.titre) {text-align: center;} .num-facture {border: 1.98pt solid black; margin: 110pt auto; width: 60%; font-weight: bold;} .num-facture table {width: 100%; padding: 5pt; font-size: 14pt;} .num-facture td.num-fac {text-align: right;} .num-facture td.titre-fac {text-align: left;} .table {width: 100%; border-collapse: collapse; margin-top: -75pt;} .table th {padding: 4pt 8pt; border: 2pt solid black; border-left-width: 1pt; border-right-width: 1pt;} .table th:first-child {border-left-width: 2pt;} .table th:last-child {border-right-width: 2pt;} .table td {padding: 8pt; font-size: 11pt; border: 2pt solid black; border-left-width: 1pt; border-right-width: 1pt;} .table td:first-child {border-left-width: 2pt;} .table td:last-child {border-right-width: 2pt;} .table tr.total td {border-width: 1pt;} tr.detail-commande {vertical-align: top;} tr.detail-commande td {padding-top: 20pt; padding-bottom: 50mm;} tr.total {font-weight: bold;} td.td-vide {border: none;} .somme-facture {margin-top: 40pt; line-height: 1.5;} .somme-facture span {text-transform: capitalize;} .footer {position: absolute; bottom: 0; width: 100%; font-size: 10.5pt; line-height: 0.5;} @media screen { .footer { bottom: 8mm; left: 8mm; right: 8mm; width: auto; } } .footer-adresse {text-decoration: underline;}
                .table {
                    table-layout: fixed;
                }
                
                .editable-num {
                    outline: none;
                    padding: 2pt 4pt;
                    padding-left: 0; 
                    border: 1px solid transparent;
                    display: inline-block;

                    &:empty,
                    &:focus {
                        border-color: #c2410b;
                        color: #c2410b;
                        padding-left: 4pt;
                        font-size: 22pt;
                    }
                }

                .editable {
                    outline: none;
                    
                    &:empty,
                    &:focus {
                        color: #c2410b;
                        font-size: 14pt;
                    }
                }

                .editable--lg {
                    &:empty,
                    &:focus {
                        font-size: 22pt;
                    }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <img class="logo" src="${Logo}" alt="logo">
                <p class="address">${data.address_header}</p>
                <div class="info-client">
                    <table>
                        <tr>
                            <td class="titre">Client</td>
                            <td>${data.patient_name}</td>
                        </tr>
                        <tr>
                            <td class="titre">Prescripteur</td>
                            <td>DR. ${data.doctor_name}</td>
                        </tr>
                        <tr>
                            <td class="titre">Date de facturation</td>
                            <td>
                                <span
                                    id="invoice-date"
                                    contentEditable="true"
                                    class="editable editable--lg"
                                    onblur="onInvoiceDateChanged(this)">
                                    ${data.invoice_date}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="num-facture">
                    <table>
                        <tr>
                            <td class="titre-fac">${isQuote ? 'Devis' : 'Facture'} N°</td>
                            <td style="display: flex; align-items: center; justify-content: flex-end;">
                                <b>${isQuote ? "DE" : "FA"}-</b>
                                <b
                                    id="invoice-number"
                                    contentEditable="true"
                                    class="editable-num"
                                    onblur="onInvoiceNumberChanged(this)"
                                    onkeydown="onInvoiceNumberKeyDown(event)">
                                    ${data.invoice_number}
                                </b>
                            </td>
                        </tr>
                    </table>
                </div>
                <table class="table">
                    <tr>
                        <th width="20%">Quantité</th>
                        <th width="40%">Désignation</th>
                        <th width="20%">Prix</th>
                        <th width="20%">Total</th>
                    </tr>
                    <tr class="detail-commande">
                        <td width="20%">1</td>
                        <td width="40%">
                            <span
                                id="service-name"
                                contentEditable="true"
                                class="editable"
                                onblur="onServiceNameChanged(this)">
                                ${data.service}
                            </span>
                        </td>
                        <td width="20%">${data.price}</td>
                        <td width="20%">${data.price}</td>
                    </tr>
                    <tr class="total">
                        <td colspan="2" class="td-vide"></td>
                        <td width="20%">Total <small>(Hors Taxe)</small></td>
                        <td width="20%">${data.price} DH</td>
                    </tr>
                </table>
                <div class="somme-facture">
                    <b>Arrêtée ${isQuote ? 'le présent devis' : 'la présente facture'} au montant hors taxe de :<br>
    <span>${data.price_letters}</span> Dirhams (${data.price} DH)</b>
                    <br><br>
                    <small style="font-size: 8pt">Sont exonérés de la TVA, sans bénéfice du droit à déduction.<br>(article 91 du CGI marocain)</small>
                </div>
                <div class="footer">
                    <p class="footer-adresse">${data.address_footer}</p>
                    <p>Patente : ${data.patente} - RC : ${data.rc} - CNSS : ${data.cnss} ICE : ${data.ice}  - IF : ${data.if}</p>
                    <p>Tél/Fax : ${data.phone} - E-mail : ${data.email}</p>
                </div>
            </div>

            <script>
                function onInvoiceNumberChanged(element) {
                    if (element.innerText === '') {
                        element.innerText = '${data.invoice_number}';
                    }

                    window.parent.postMessage({
                        type: 'invoice-number-changed',
                        num: element.innerText || '${data.invoice_number}',
                    }, '*');
                }


                function onInvoiceNumberKeyDown(event) {
                    const allowedKeys = [
                        'Backspace',
                        'Tab',
                        'ArrowLeft',
                        'ArrowRight',
                        'Delete',
                        'Enter',
                    ];

                    const isDigit = event.key >= '0' && event.key <= '9';
                    const isAllowed = isDigit || allowedKeys.includes(event.key);

                    if (!isAllowed) {
                        event.preventDefault();
                        return;
                    }

                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.target.blur();
                    }
                }

                function onServiceNameChanged(element) {
                    if (element.innerText === '') {
                        element.innerText = '${data.service}';
                    }
                    window.parent.postMessage({
                        type: 'service-name-changed',
                        name: element.innerText || '${data.service}',
                    }, '*');
                }

                function onInvoiceDateChanged(element) {
                    if (element.innerText === '') {
                        element.innerText = '${data.invoice_date}';
                    }
                    window.parent.postMessage({
                        type: 'invoice-date-changed',
                        date: element.innerText || '${data.invoice_date}'
                    }, '*');
                }

                window.addEventListener('message', (event) => {
                    if (event.data.action === 'reload') {
                        window.location.reload();
                    }
                });
            </script>
        </body>
        </html>
    `

    return htmlContent;
}

export const printTransactions = (dates, data, total) => {
    const htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                ${printFontFr}
                @page {size: A4; margin: 15mm;}
                * {box-sizing: border-box;}
                body {
                    font-family: Figtree, sans-serif;
                    margin: 0;
                }

                @media screen { body { zoom: 95%; height: 100%; } .page { padding: 8mm; background-color: #fff; border-radius: 10pt; min-height: 100%; } }
                
                .hidden {display: none !important;}

                .header {
                    display: flex;
                    justify-content: space-between;
                }

                h1, h2 {
                    line-height: 1;
                    margin-top: 0;

                    small {
                        display: block;
                        font-size: 10pt;
                        font-weight: normal;
                        margin-bottom: 5pt;
                    }
                }

                h2 {
                    text-align: right;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20pt;
                    font-size: 9pt;
                }

                th, td {
                    padding: 8pt 12pt;
                    text-align: left;

                    &:first-child {
                        padding-left: 0;
                    }

                    &:last-child {
                        padding-right: 0;
                        text-align: right;
                    }
                }

                th {
                    font-weight: bold;
                }
                
                td {
                    border-top: 1pt solid #999;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <h1>
                        <small class="${dates.end ? '' : 'hidden'}">Du ${dates.start} au ${dates.end}</small>
                        <small class="${dates.end ? 'hidden' : ''}">${dates.start}</small>
                        Liste des réglements
                    </h1>
                    <h2>
                        <small>Total</small>
                        ${total} DH
                    </h2>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Prestation</th>
                            <th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${format(item.date, "dd/MM/yyyy à HH:mm")}</td>
                                <td>${item.patient_name}</td>
                                <td>${item.service_id}</td>
                                <td><b>${item.amount} DH</b></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `

    return htmlContent;
}

export const printPatients = (data) => {
    const htmlContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                ${printFontFr}
                @page {size: A4; margin: 15mm;}
                * {box-sizing: border-box;}
                body {
                    font-family: Figtree, sans-serif;
                    margin: 0;
                }

                @media screen { body { zoom: 85%; height: 100%; } .page { padding: 8mm; background-color: #fff; border-radius: 10pt; min-height: 100%; } }
                
                .hidden {display: none !important;}

                .header {
                    display: flex;
                    justify-content: space-between;
                }

                h1, h2 {
                    line-height: 1;
                    margin-top: 0;

                    small {
                        font-size: 16pt;
                        font-weight: normal;
                        margin-left: 10pt;
                    }
                }

                h2 {
                    text-align: right;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20pt;
                    font-size: 9pt;
                }

                th, td {
                    padding: 8pt 12pt;
                    text-align: left;

                    &:first-child {
                        padding-left: 0;
                    }

                    &:last-child {
                        padding-right: 0;
                    }
                }

                th {
                    font-weight: bold;
                }
                
                td {
                    border-top: 1pt solid #999;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <h1>
                        Liste des patients
                        <small>(${data.length})</small>
                    </h1>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Créé le</th>
                            <th>Téléphone</th>
                            <th>Mutuelle</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.last_name}</td>
                                <td>${item.first_name}</td>
                                <td>
                                    <span style="text-transform: capitalize">${format(item.created_at, "dd MMM y")}</span>
                                    <span>${format(item.created_at, " à HH:mm")}</span>
                                </td>
                                <td>${item.phone}${item.phone2 ? '<br>': ''}${item.phone2}</td>
                                <td>${item.mutual_name || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `

    return htmlContent;
}