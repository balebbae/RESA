"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2, CalendarIcon } from "lucide-react"
import type { Event } from "@/types/event"
import type { Employee } from "@/types/employee"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers"

const eventSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional(),
  date: z.date(),
})

type EventFormData = z.infer<typeof eventSchema>

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i).padStart(2, "0")
  const label =
    i === 0 ? "12 AM" : i === 12 ? "12 PM" : i < 12 ? `${i} AM` : `${i - 12} PM`
  return { value: hour, label }
})

const MINUTES = ["00", "15", "30", "45"]

interface EventEditDialogProps {
  restaurantId: number | null
  event: Event | null
  employees: Employee[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EventEditDialog({
  restaurantId,
  event,
  employees,
  isOpen,
  onOpenChange,
  onSuccess,
}: EventEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Time state
  const [startHour, setStartHour] = useState("09")
  const [startMinute, setStartMinute] = useState("00")
  const [endHour, setEndHour] = useState("10")
  const [endMinute, setEndMinute] = useState("00")

  // Employees state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
    },
  })

  const selectedDate = watch("date")

  // Fetch event details (employees) when dialog opens
  useEffect(() => {
    if (isOpen && event && restaurantId) {
      // Set form values
      setValue("title", event.title)
      setValue("description", event.description)
      setValue("date", new Date(event.date + "T00:00:00")) // Handle timezone safely? Usually YYYY-MM-DD

      // Set time values
      const [sH, sM] = event.start_time.split(":")
      const [eH, eM] = event.end_time.split(":")
      setStartHour(sH)
      setStartMinute(sM)
      setEndHour(eH)
      setEndMinute(eM)

      // Use pre-fetched employees if available, otherwise fetch
      if (event.employees) {
        setSelectedEmployeeIds(event.employees.map((e) => e.id))
      } else {
        // Fetch assigned employees
        const fetchEmployees = async () => {
          setIsLoadingEmployees(true)
          try {
            const res = await fetchWithAuth(
              `${getApiBase()}/restaurants/${restaurantId}/events/${event.id}/employees`
            )
            if (res.ok) {
              const assigned = await res.json()
              if (Array.isArray(assigned)) {
                setSelectedEmployeeIds(assigned.map((e: Employee) => e.id))
              }
            }
          } catch (err) {
            console.error("Failed to fetch event employees", err)
          } finally {
            setIsLoadingEmployees(false)
          }
        }
        fetchEmployees()
      }
    }
  }, [isOpen, event, restaurantId, setValue])

  const onSubmit = async (data: EventFormData) => {
    if (!restaurantId || !event) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        date: format(data.date, "yyyy-MM-dd"),
        start_time: `${startHour}:${startMinute}`,
        end_time: `${endHour}:${endMinute}`,
        employee_ids: selectedEmployeeIds,
      }

      const res = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/events/${event.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to update event")
      }

      showSuccessToast("Event updated successfully")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update event"
      setError(msg)
      showErrorToast(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurantId || !event) return
    
    setIsDeleting(true)
    try {
      const res = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/events/${event.id}`,
        {
          method: "DELETE",
        }
      )

      if (!res.ok) {
        throw new Error("Failed to delete event")
      }

      showSuccessToast("Event deleted successfully")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete event"
      setError(msg)
      showErrorToast(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event details and assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="Event title" />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue("date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="flex gap-1">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        :{m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="flex gap-1">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        :{m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description"
              className="resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Employees</Label>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No employees available
                </p>
              ) : (
                employees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1.5 rounded"
                  >
                    <Checkbox
                      checked={selectedEmployeeIds.includes(emp.id)}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                    />
                    <span className="truncate">{emp.full_name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">Delete</span>
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
