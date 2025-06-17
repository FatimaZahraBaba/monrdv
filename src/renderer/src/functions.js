export const capitaliseWords = (str) => {
    return str
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("-")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return "";
    return phoneNumber.replace(/(\d{2})(?=\d)/g, "$1 ").trim()
}

export const getStatusOptions = () => {
    return [
        { id: "active", name: "En cours" },
        { id: "passed", name: "Terminé" },
        { id: "delivered", name: "Livré" },
        { id: "instance", name: "En instance" },
        { id: "cancelled", name: "Annulé" }
    ];
}

export const getStatusBackground = (status) => {
    switch (status) {
        case "active":
            return "!bg-orange-200 !text-orange-700";
        case "instance":
            return "!bg-red-200 !text-red-700";
        case "passed":
            return "!bg-cyan-200 !text-cyan-700";
        case "delivered":
            return "!bg-green-200 !text-green-700";
        case "cancelled":
            return "!bg-gray-300 !text-gray-700";
        default:
            return null;
    }
}

export const getStatusBackgroundOnly = (status) => {
    switch (status) {
        case "active":
            return "bg-orange-300";
        case "instance":
            return "bg-red-300";
        case "passed":
            return "bg-cyan-300";
        case "delivered":
            return "bg-green-300";
        case "cancelled":
            return "bg-gray-400";
        default:
            return null;
    }
}


export const getStatusText = (status) => {
    const options = getStatusOptions();
    const option = options.find(option => option.id === status);
    return option ? option.name : null;
}

export const getWorkshopStatusOptions = () => {
    return [
        { id: "not_sent", name: "Non envoyée" },
        { id: "sent", name: "Envoyée" },
        { id: "received", name: "Reçu" },
    ];
}

export const getWorkshopStatusBackground = (status) => {
    switch (status) {
        case "not_sent":
            return "!bg-gray-200 !text-gray-700";
        case "sent":
            return "!bg-orange-200 !text-orange-700";
        case "received":
            return "!bg-green-200 !text-green-700";
        default:
            return null;
    }
}

export const getWorkshopStatusBackgroundOnly = (status) => {
    switch (status) {
        case "not_sent":
            return "bg-gray-400";
        case "sent":
            return "bg-orange-600";
        case "received":
            return "bg-green-600";
        default:
            return null;
    }
}

export const getWorkshopStatusText = (status) => {
    const options = getWorkshopStatusOptions();
    const option = options.find(option => option.id === status);
    return option ? option.name : null;
}
