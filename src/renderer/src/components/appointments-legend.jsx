import { getStatusBackground, getStatusOptions } from "@/functions";
import { Badge } from "./ui/badge";

const statusOptions = getStatusOptions();

const AppointmentLegend = () => {
    return (
        <div className="flex items-center space-x-2 p-2.5 text-nowrap border rounded-md bg-muted/50">
            {
                statusOptions.map((status) => (
                    <Badge key={status.id} className={getStatusBackground(status.id)}>
                        {status.name}
                    </Badge>
                ))
            }
        </div>
    )
}

export default AppointmentLegend;
