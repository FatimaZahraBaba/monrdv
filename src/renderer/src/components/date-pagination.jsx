import { useRef, useEffect, useState } from "react"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Datepicker from "./datepicker"
import isToday from "date-fns/isToday"

// Pure debounce function with cancel support
function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef(null)

    const debouncedFn = (value) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            callback(value)
        }, delay)
    }

    // Optional: cancel on unmount
    useEffect(() => {
        return () => clearTimeout(timeoutRef.current)
    }, [])

    return debouncedFn
}

export default function DatePagination({ onChange }) {
    const [date, setDate] = useState(new Date())
    const debouncedChange = useDebouncedCallback(onChange, 300)

    const updateDate = (newDate, debounce = false) => {
        setDate(newDate)
        if (debounce) {
            debouncedChange(newDate)
        } else {
            onChange?.(newDate)
        }
    }

    const goBackward = () => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() - 1)
        updateDate(newDate, true)
    }

    const goForward = () => {
        const today = new Date()
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + 1)
        if (newDate > today) {
            newDate.setDate(today.getDate())
        }
        updateDate(newDate, true)
    }

    const onDatePicker = ({ date }) => {
        updateDate(date)
    }

    return (
        <div className="flex items-center justify-center">
            <Button variant="ghost" size="icon" onClick={goBackward}>
                <ChevronLeft />
            </Button>
            <span>
                <Datepicker simple value={date} onChange={onDatePicker} disabled={{ after: new Date() }} />
            </span>

            {
                !isToday(date) &&
                <>
                    <Button variant="ghost" size="icon" onClick={goForward}>
                        <ChevronRight />
                    </Button>
                    <Button variant="ghost" className="text-xs text-gray-400" onClick={() => updateDate(new Date())}>
                        Aujourd'hui
                    </Button>
                </>
            }
        </div>
    )
}
