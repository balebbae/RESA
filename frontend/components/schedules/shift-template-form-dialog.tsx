"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShiftTemplateForm } from "@/hooks/use-shift-template-form";

interface ShiftTemplateFormDialogProps {
  mode?: "create" | "edit";
  restaurantId: number | null;
  shiftTemplateId?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (shiftTemplate: unknown) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

/**
 * Shift template form dialog for creating and editing shift templates
 */
export function ShiftTemplateFormDialog({
  mode = "create",
  restaurantId,
  shiftTemplateId,
  isOpen: externalOpen,
  onOpenChange,
  onSuccess,
}: ShiftTemplateFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const dialogOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setDialogOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSuccess = (shiftTemplate: unknown) => {
    setDialogOpen(false);
    if (onSuccess) {
      onSuccess(shiftTemplate);
    }
  };

  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    isLoading,
    error,
    reset,
    setValue,
    watch,
  } = useShiftTemplateForm({
    mode,
    restaurantId,
    shiftTemplateId,
    onSuccess: handleSuccess,
    isOpen: dialogOpen,
  });

  const isEditMode = mode === "edit";
  const dialogTitle = isEditMode
    ? "Edit Shift Template"
    : "Add New Shift Template";
  const dialogDescription = isEditMode
    ? "Update shift template information."
    : "Add a new shift template to this workplace.";
  const submitButtonText = isSubmitting
    ? isEditMode
      ? "Updating..."
      : "Adding..."
    : isEditMode
    ? "Update Shift Template"
    : "Add Shift Template";

  const selectedDayOfWeek = watch("day_of_week");

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(error || isLoading) && (
            <p className="text-sm text-red-600">
              {error || "Loading shift template details..."}
            </p>
          )}

          <FieldGroup>
            {/* Name Field (Optional) */}
            <Field>
              <FieldLabel htmlFor="name">Name (Optional)</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Morning Shift, Closing Shift"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </Field>

            {/* Day of Week Selection */}
            <Field>
              <FieldLabel htmlFor="day_of_week">Day of Week</FieldLabel>
              <Select
                value={
                  selectedDayOfWeek !== undefined
                    ? selectedDayOfWeek.toString()
                    : "0"
                }
                onValueChange={(value) =>
                  setValue("day_of_week", parseInt(value))
                }
              >
                <SelectTrigger id="day_of_week" className="w-full">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.day_of_week && (
                <p className="text-sm text-red-600">
                  {errors.day_of_week.message}
                </p>
              )}
            </Field>

            {/* Start Time */}
            <Field>
              <FieldLabel htmlFor="start_time">Start Time</FieldLabel>
              <Input id="start_time" type="time" {...register("start_time")} />
              {errors.start_time && (
                <p className="text-sm text-red-600">
                  {errors.start_time.message}
                </p>
              )}
            </Field>

            {/* End Time */}
            <Field>
              <FieldLabel htmlFor="end_time">End Time</FieldLabel>
              <Input id="end_time" type="time" {...register("end_time")} />
              {errors.end_time && (
                <p className="text-sm text-red-600">
                  {errors.end_time.message}
                </p>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {submitButtonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
