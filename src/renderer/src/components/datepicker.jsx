import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './ui/calendar'
import format from 'date-fns/format'
import { Button } from './ui/button'
import { fr } from 'date-fns/locale'

function Datepicker({ value, placeholder, name, onChange, disabled, simple }) {
    const [isOpen, setIsOpen] = useState(false)
    const [month, setMonth] = useState(new Date());

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {
                    simple ?
                        <Button
                            variant="ghost"
                            className={cn(
                                value ? "" : "text-muted-foreground"
                            )}>
                            {value ? format(value, "dd/MM/y") : <span>{placeholder || "Sélectionnez une date"}</span>}
                        </Button>
                        :
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                value ? "font-bold" : "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {value ? format(value, "dd/MM/y") : <span>{placeholder || "Sélectionnez une date"}</span>}
                        </Button>
                }
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    locale={fr}
                    classNames={{
                        caption_label: "text-sm font-medium capitalize",
                        head_row: "flex capitalize",
                        day_selected: "!bg-orange-600 !text-white",
                        day_disabled: "!opacity-50 !bg-transparent"
                    }}
                    disabled={disabled || { before: new Date() }}
                    selected={value}
                    onSelect={(date) => {
                        onChange({ target: { name, value: date }, date });
                        setIsOpen(false);
                    }}
                    month={month}
                    onMonthChange={setMonth}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

export default Datepicker