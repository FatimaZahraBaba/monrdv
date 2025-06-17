import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import clsx from "clsx";

const Dropdown = ({ options, placeholder, value, name, onChange, disabled, simple, clearable, searchable = true, renderItem, triggerClass }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const clearValue = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: null }, id: null });
        setIsOpen(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    className={clsx(
                        "w-full justify-between",
                        value ? "font-bold" : "text-muted-foreground",
                        triggerClass?.(value),
                        simple && "!border-0 !bg-transparent !p-0 !h-auto",
                        disabled && simple && "!text-muted-foreground",
                    )}>
                    {options.find((d) => d.id == value)?.name || placeholder}
                    <span className="flex items-center">
                        {
                            clearable && value &&
                            <Button size="icon" variant="ghost" className={simple ? "h-5 w-5" : "h-9"} onClick={clearValue}>
                                <XIcon />
                            </Button>
                        }
                        {
                            !simple && <ChevronDown />
                        }
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    {
                        searchable &&
                        <CommandInput
                            placeholder="Faire une recherche..." />
                    }
                    <CommandList>
                        {options
                            .map((item, index) => (
                                <CommandItem
                                    key={index}
                                    value={item.id}
                                    onSelect={() => {
                                        onChange({ target: { name, value: item.id }, id: item.id })
                                        setIsOpen(false)
                                    }}
                                >
                                    {
                                        typeof renderItem === "function" ? renderItem(item) : item.name
                                    }
                                </CommandItem>
                            ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default Dropdown