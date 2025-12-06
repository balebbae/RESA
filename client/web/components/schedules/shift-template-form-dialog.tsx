"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, ChevronsUpDown, Plus } from "lucide-react";
import { useShiftTemplateForm } from "@/hooks/use-shift-template-form";
import { getApiBase } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import type { Role } from "@/types/role";
import { RoleFormDialog } from "@/components/roles/role-form-dialog";

interface ShiftTemplateFormDialogProps {
  mode?: "create" | "edit";
  restaurantId: number | null;
  shiftTemplateId?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (shiftTemplate: unknown) => void;
  /** Pre-select this day when dialog opens (0-6, Sunday-Saturday) */
  initialDayOfWeek?: number;
  /** Pre-fill start time when dialog opens (HH:MM format) */
  initialStartTime?: string;
  /** Pre-fill end time when dialog opens (HH:MM format) */
  initialEndTime?: string;
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

const MINUTES = ["00", "15", "30", "45"];

// Generate hours array (0-23) with display labels
const HOURS = Array.from({ length: 24 }, (_, i) => {
  let displayLabel;
  if (i === 0) displayLabel = "12 AM";
  else if (i === 12) displayLabel = "12 PM";
  else if (i < 12) displayLabel = `${i} AM`;
  else displayLabel = `${i - 12} PM`;

  return {
    value: String(i).padStart(2, "0"),
    label: displayLabel,
  };
});

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
  initialDayOfWeek,
  initialStartTime,
  initialEndTime,
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

  const selectedDayOfWeek = watch("day_of_week");
  const currentStartTime = watch("start_time");
  const currentEndTime = watch("end_time");

  // State for separate hour and minute selections
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("00");

  // State for multi-day selection
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // State for role selection
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesValidationError, setRolesValidationError] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  // Submit button text (defined after state to access isCreating and selectedDays)
  const submitButtonText = isCreating
    ? `Creating ${selectedDays.length} template${
        selectedDays.length > 1 ? "s" : ""
      }...`
    : isSubmitting
    ? isEditMode
      ? "Updating..."
      : "Adding..."
    : isEditMode
    ? "Update Shift Template"
    : "Add Shift Template";

  // Sync form values to local state when they change
  useEffect(() => {
    if (currentStartTime) {
      const [hour, minute] = currentStartTime.split(":");
      setStartHour(hour);
      setStartMinute(minute);
    }
  }, [currentStartTime]);

  useEffect(() => {
    if (currentEndTime) {
      const [hour, minute] = currentEndTime.split(":");
      setEndHour(hour);
      setEndMinute(minute);
    }
  }, [currentEndTime]);

  // Update form value when hour/minute changes
  const handleStartHourChange = (hour: string) => {
    setStartHour(hour);
    setValue("start_time", `${hour}:${startMinute}`);
  };

  const handleStartMinuteChange = (minute: string) => {
    setStartMinute(minute);
    setValue("start_time", `${startHour}:${minute}`);
  };

  const handleEndHourChange = (hour: string) => {
    setEndHour(hour);
    setValue("end_time", `${hour}:${endMinute}`);
  };

  const handleEndMinuteChange = (minute: string) => {
    setEndMinute(minute);
    setValue("end_time", `${endHour}:${minute}`);
  };

  // Handler for removing a day from selection
  const handleDayRemove = (dayValue: number) => {
    setSelectedDays(selectedDays.filter((d) => d !== dayValue));
  };

  // Fetch available roles for the restaurant
  const fetchRoles = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setRolesLoading(true);
      setRolesError(null);

      const rolesRes = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/roles`
      );
      if (!rolesRes.ok) {
        throw new Error(`Failed to fetch roles (${rolesRes.status})`);
      }
      const rolesResponse = await rolesRes.json();
      const roles = Array.isArray(rolesResponse)
        ? rolesResponse
        : rolesResponse.data || [];
      setAvailableRoles(roles);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRolesError(
        err instanceof Error ? err.message : "Failed to load roles"
      );
      setAvailableRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [restaurantId]);

  // Fetch roles when dialog opens
  useEffect(() => {
    if (dialogOpen && restaurantId) {
      fetchRoles();
    }
  }, [dialogOpen, restaurantId, fetchRoles]);

  // Clear validation errors when dialog opens/closes
  useEffect(() => {
    if (!dialogOpen) {
      setRolesValidationError(null);
      setSubmissionError(null);
    }
  }, [dialogOpen]);

  // Apply initial values when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      // Apply initial day of week
      if (initialDayOfWeek !== undefined) {
        setSelectedDays([initialDayOfWeek]);
      }

      // Apply initial start time
      if (initialStartTime) {
        const [hour, minute] = initialStartTime.split(":");
        setStartHour(hour);
        setStartMinute(minute);
        setValue("start_time", initialStartTime);
      }

      // Apply initial end time
      if (initialEndTime) {
        const [hour, minute] = initialEndTime.split(":");
        setEndHour(hour);
        setEndMinute(minute);
        setValue("end_time", initialEndTime);
      }
    }
  }, [dialogOpen, initialDayOfWeek, initialStartTime, initialEndTime, setValue]);

  // Handler for role removal
  const handleRoleRemove = (roleId: number) => {
    setSelectedRoles(selectedRoles.filter((r) => r.id !== roleId));
  };

  // Handler for role creation
  const handleRoleCreated = async (newRole: unknown) => {
    // Refetch roles to get the latest list from backend
    await fetchRoles();

    // Extract role from either direct or wrapped response
    const role = (newRole && typeof newRole === 'object' && 'data' in newRole)
      ? (newRole as Record<string, unknown>).data
      : newRole;

    // Automatically select the newly created role
    if (role && typeof role === 'object' && 'id' in role) {
      const roleObj = role as Role;
      setSelectedRoles(prev => {
        // Only add if not already selected
        if (prev.some(r => r.id === roleObj.id)) {
          return prev;
        }
        return [...prev, roleObj];
      });
    }

    setShowRoleDialog(false);
  };

  // Custom submit handler for multi-day creation
  const handleMultiDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one day is selected
    if (selectedDays.length === 0) {
      setSubmissionError("Please select at least one day");
      return;
    }

    // Validate that at least one role is selected
    if (selectedRoles.length === 0) {
      setRolesValidationError("Please select at least one role");
      return;
    }

    setIsCreating(true);
    setSubmissionError(null);
    setRolesValidationError(null);

    try {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required");
      }

      const createdTemplates = [];
      const failedDays: { day: string; error: string }[] = [];

      // Create template for each selected day sequentially
      for (const dayValue of selectedDays) {
        const dayName =
          DAYS_OF_WEEK.find((d) => d.value === dayValue)?.label || "Unknown";

        try {
          const payload = {
            name: watch("name") || undefined,
            day_of_week: dayValue,
            start_time: `${startHour}:${startMinute}`,
            end_time: `${endHour}:${endMinute}`,
            role_ids:
              selectedRoles.length > 0
                ? selectedRoles.map((r) => r.id)
                : undefined,
          };

          const res = await fetchWithAuth(
            `${getApiBase()}/restaurants/${restaurantId}/shift-templates`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );

          if (!res.ok) {
            const errorText = await res.text();
            console.error(
              `Failed to create template for ${dayName}:`,
              errorText
            );
            throw new Error(errorText.slice(0, 300));
          }

          const template = await res.json();
          createdTemplates.push(template);
        } catch (dayError) {
          const errorMsg =
            dayError instanceof Error ? dayError.message : "Unknown error";
          console.error(`Error creating template for ${dayName}:`, dayError);
          failedDays.push({
            day: dayName,
            error: errorMsg,
          });
        }
      }

      // Handle results
      if (failedDays.length > 0) {
        // Build detailed error message
        const errorDetails = failedDays
          .map((f) => `${f.day}: ${f.error}`)
          .join("\n");
        const errorMsg = `Failed to create templates:\n${errorDetails}`;

        if (createdTemplates.length > 0) {
          setSubmissionError(
            `${errorMsg}\n\nSuccessfully created ${createdTemplates.length} template(s).`
          );
        } else {
          setSubmissionError(errorMsg);
        }
      } else {
        // All succeeded - close dialog and notify parent
        setDialogOpen(false);
        setSelectedDays([]);
        if (onSuccess) {
          onSuccess(createdTemplates);
        }
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : "Failed to create shift templates"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMultiDaySubmit} className="space-y-4">
          {(submissionError || error || isLoading) && (
            <div className="text-sm text-red-600 whitespace-pre-line">
              {submissionError || error || "Loading shift template details..."}
            </div>
          )}

          <FieldGroup>
            {/* Name Field */}
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Morning Shift, Closing Shift"
                {...register("name")}
                required
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </Field>

            {/* Days of Week Selection (Multi-select with Popover) */}
            <Field>
              <FieldLabel htmlFor="days">Days of Week</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="days"
                    variant="outline"
                    role="combobox"
                    type="button"
                    className="w-full justify-between font-normal"
                  >
                    {selectedDays.length > 0
                      ? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} selected`
                      : "Select days"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDays([...selectedDays, day.value].sort());
                            } else {
                              setSelectedDays(selectedDays.filter((d) => d !== day.value));
                            }
                          }}
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Display selected days as badges */}
              {selectedDays.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDays.map((dayValue) => {
                    const day = DAYS_OF_WEEK.find((d) => d.value === dayValue);
                    return (
                      <Badge
                        key={dayValue}
                        variant="secondary"
                        className="gap-1"
                      >
                        {day?.label}
                        <button
                          type="button"
                          onClick={() => handleDayRemove(dayValue)}
                          className="ml-1 rounded-full hover:bg-muted"
                          aria-label={`Remove ${day?.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {errors.day_of_week && (
                <p className="text-sm text-red-600">
                  {errors.day_of_week.message}
                </p>
              )}
            </Field>

            {/* Roles Selection (Multi-select with Popover) */}
            <Field>
              <FieldLabel htmlFor="roles">Roles</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="roles"
                    variant="outline"
                    role="combobox"
                    type="button"
                    className="w-full justify-between font-normal"
                    disabled={rolesLoading}
                  >
                    {selectedRoles.length > 0
                      ? `${selectedRoles.length} role${selectedRoles.length > 1 ? "s" : ""} selected`
                      : rolesLoading ? "Loading roles..." : "Select roles"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {/* Checkbox for each role */}
                    {availableRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedRoles.some(r => r.id === role.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRoles([...selectedRoles, role]);
                              setRolesValidationError(null);
                            } else {
                              setSelectedRoles(selectedRoles.filter(r => r.id !== role.id));
                            }
                          }}
                        />
                        <span className="text-sm">{role.name}</span>
                      </label>
                    ))}

                    {/* Divider */}
                    {availableRoles.length > 0 && (
                      <div className="border-t my-1" />
                    )}

                    {/* Create new role button */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-start text-primary font-medium"
                      onClick={() => setShowRoleDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new role
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Error messages */}
              {rolesError && (
                <p className="text-sm text-red-600">{rolesError}</p>
              )}

              {rolesValidationError && (
                <p className="text-sm text-red-600">{rolesValidationError}</p>
              )}

              {/* Display selected roles as badges */}
              {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoles.map((role) => (
                    <Badge key={role.id} variant="secondary" className="gap-1">
                      {role.name}
                      <button
                        type="button"
                        onClick={() => handleRoleRemove(role.id)}
                        className="ml-1 rounded-full hover:bg-muted"
                        aria-label={`Remove ${role.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            {/* Start Time */}
            <Field>
              <FieldLabel>Start Time</FieldLabel>
              <div className="flex gap-2">
                <Select value={startHour} onValueChange={handleStartHourChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[180px]">
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={startMinute}
                  onValueChange={handleStartMinuteChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.start_time && (
                <p className="text-sm text-red-600">
                  {errors.start_time.message}
                </p>
              )}
            </Field>

            {/* End Time */}
            <Field>
              <FieldLabel>End Time</FieldLabel>
              <div className="flex gap-2">
                <Select value={endHour} onValueChange={handleEndHourChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[180px]">
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={endMinute} onValueChange={handleEndMinuteChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.end_time && (
                <p className="text-sm text-red-600">
                  {errors.end_time.message}
                </p>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || isCreating}
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Role Creation Dialog */}
    <RoleFormDialog
      mode="create"
      restaurantId={restaurantId}
      isOpen={showRoleDialog}
      onOpenChange={setShowRoleDialog}
      onSuccess={handleRoleCreated}
    />
  </>
  );
}
