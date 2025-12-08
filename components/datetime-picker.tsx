"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function DateTimePicker({
    date,
    setDate,
}: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}) {
    const [isOpen, setIsOpen] = React.useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            if (date) {
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
            } else {
                // Default to 12:00 if no time set previously
                newDate.setHours(12);
                newDate.setMinutes(0);
            }
            setDate(newDate);
        } else {
            setDate(undefined);
        }
    };

    const handleTimeChange = (type: "hour" | "minute", value: number) => {
        if (!date) return;
        const newDate = new Date(date);
        if (type === "hour") {
            newDate.setHours(value);
        } else if (type === "minute") {
            newDate.setMinutes(value);
        }
        setDate(newDate);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                        format(date, "PPP p")
                    ) : (
                        <span>Pick a date & time</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col sm:flex-row">
                    <div className="border-r border-border">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </div>
                    <div className="flex flex-col sm:w-[200px]">
                        <div className="flex items-center justify-center p-3 border-b border-border bg-muted/40 text-muted-foreground font-medium text-sm">
                            <Clock className="w-4 h-4 mr-2" />
                            Time Selection
                        </div>
                        <div className="flex h-[300px] divide-x divide-border">
                            <ScrollArea className="w-[100px]">
                                <div className="flex flex-col p-2 gap-1 h-full">
                                    <span className="text-xs text-center text-muted-foreground mb-1">Hour</span>
                                    {hours.map((hour) => (
                                        <Button
                                            key={hour}
                                            size="sm"
                                            variant={date && date.getHours() === hour ? "default" : "ghost"}
                                            className="w-full shrink-0"
                                            onClick={() => handleTimeChange("hour", hour)}
                                        >
                                            {hour.toString().padStart(2, '0')}
                                        </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                            <ScrollArea className="w-[100px]">
                                <div className="flex flex-col p-2 gap-1 h-full">
                                    <span className="text-xs text-center text-muted-foreground mb-1">Min</span>
                                    {minutes.map((minute) => (
                                        <Button
                                            key={minute}
                                            size="sm"
                                            variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                                            className="w-full shrink-0"
                                            onClick={() => handleTimeChange("minute", minute)}
                                        >
                                            {minute.toString().padStart(2, '0')}
                                        </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
