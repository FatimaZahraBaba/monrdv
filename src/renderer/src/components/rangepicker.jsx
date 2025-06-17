import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CalendarX2, ChevronDown, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "./ui/calendar";
import { fr } from "date-fns/locale";
import format from "date-fns/format";

const RangePicker = ({ placeholder, value, onChange, disabled, clearable }) => {
    const [isOpen, setIsOpen] = useState(false);

    const clearValue = (e) => {
        e.stopPropagation();
        onChange({ from: null, to: null });
        setIsOpen(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex">
                    <Button variant="outline" className="min-w-[280px] w-full justify-between text-left font-normal">
                        {
                            value?.from ? (
                                <span className="capitalize">
                                    {format(value.from, "dd MMM y")}
                                    {value.to && " - "}
                                    {value.to && format(value.to, "dd MMM y")}
                                </span>
                            ) : (
                                <span className="text-muted-foreground">{placeholder || "Choisir une période"}</span>
                            )
                        }
                        <span className="flex items-center">
                            {
                                clearable && value?.from &&
                                <Button size="icon" variant="ghost" className="h-9" onClick={clearValue}>
                                    <XIcon className="text-red-600" />
                                </Button>
                            }
                            <CalendarIcon className="h-4 w-4" />
                        </span>
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    locale={fr}
                    initialFocus
                    mode="range"
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    )
}

export default RangePicker