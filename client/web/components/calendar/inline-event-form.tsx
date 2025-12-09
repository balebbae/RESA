"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Employee } from "@/types/employee";
import { getApiBase } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

const inlineEventSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional(),
});

type InlineEventFormData = z.infer<typeof inlineEventSchema>;

interface InlineEventFormProps {
  restaurantId: number | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (pre-filled from selection)
  endTime: string; // HH:MM (pre-filled from selection)
  employees: Employee[];
  onSuccess: () => void;
  onCancel: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i).padStart(2, "0");
  const label =
    i === 0
      ? "12 AM"
      : i === 12
      ? "12 PM"
      : i < 12
      ? `${i} AM`
      : `${i - 12} PM`;
  return { value: hour, label };
});

const MINUTES = ["00", "15", "30", "45"];

export function InlineEventForm({
  restaurantId,
  date,
  startTime,
  endTime,
  employees,
  onSuccess,
  onCancel,
}: InlineEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [showEmployees, setShowEmployees] = useState(false);

  // Parse initial times - handle both HH:MM and HH:MM:SS formats
  const parseTimeComponent = (time: string, index: number): string => {
    const parts = time.split(":");
    return parts[index]?.padStart(2, "0") || (index === 0 ? "09" : "00");
  };

  const [startHour, setStartHour] = useState(parseTimeComponent(startTime, 0));
  const [startMinute, setStartMinute] = useState(
    parseTimeComponent(startTime, 1)
  );
  const [endHour, setEndHour] = useState(parseTimeComponent(endTime, 0));
  const [endMinute, setEndMinute] = useState(parseTimeComponent(endTime, 1));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InlineEventFormData>({
    resolver: zodResolver(inlineEventSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data: InlineEventFormData) => {
    if (!restaurantId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        date,
        start_time: `${startHour}:${startMinute}`,
        end_time: `${endHour}:${endMinute}`,
      };

      const res = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create event");
      }

      const event = await res.json();
      const eventId = event.data?.id || event.id;

      // Assign employees if selected
      if (selectedEmployeeIds.length > 0 && eventId) {
        await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/events/${eventId}/employees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employee_ids: selectedEmployeeIds }),
          }
        );
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">New Event</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      {/* Title */}
      <div>
        <Input
          {...register("title")}
          placeholder="Event title"
          className="text-sm h-9"
          autoFocus
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description (optional) */}
      <Textarea
        {...register("description")}
        placeholder="Description (optional)"
        className="text-sm resize-none h-16"
      />

      {/* Time Selection */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Start</Label>
          <div className="flex gap-1">
            <Select value={startHour} onValueChange={setStartHour}>
              <SelectTrigger className="text-xs h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {HOURS.map((h) => (
                  <SelectItem key={h.value} value={h.value} className="text-xs">
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={startMinute} onValueChange={setStartMinute}>
              <SelectTrigger className="text-xs h-8 w-14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    :{m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">End</Label>
          <div className="flex gap-1">
            <Select value={endHour} onValueChange={setEndHour}>
              <SelectTrigger className="text-xs h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {HOURS.map((h) => (
                  <SelectItem key={h.value} value={h.value} className="text-xs">
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={endMinute} onValueChange={setEndMinute}>
              <SelectTrigger className="text-xs h-8 w-14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    :{m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Employee Assignment (collapsible) */}
      {employees.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowEmployees(!showEmployees)}
            className="flex items-center gap-1 text-xs "
          >
            {showEmployees ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showEmployees ? "Hide" : "Add"} employees
            {selectedEmployeeIds.length > 0 &&
              ` (${selectedEmployeeIds.length})`}
          </button>
          {showEmployees && (
            <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
              {employees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent p-1 rounded"
                >
                  <Checkbox
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onCheckedChange={() => toggleEmployee(emp.id)}
                  />
                  <span className="truncate">{emp.full_name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full "
        size="sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Event"
        )}
      </Button>
    </form>
  );
}
