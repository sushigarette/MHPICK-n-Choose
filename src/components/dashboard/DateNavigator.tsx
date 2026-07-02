import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { isDateDisponible, findAvailableDate } from "@/lib/dates";

interface DateNavigatorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, onChange }) => {
  const prevDate = findAvailableDate(selectedDate, -1);
  const nextDate = findAvailableDate(selectedDate, 1);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={!prevDate}
        onClick={() => prevDate && onChange(prevDate)}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "EEEE d MMMM", { locale: fr })
            ) : (
              <span>Choisir une date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onChange(new Date(date))}
            className="rounded-md border"
            disabled={(date) => !isDateDisponible(date)}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        disabled={!nextDate}
        onClick={() => nextDate && onChange(nextDate)}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DateNavigator;
