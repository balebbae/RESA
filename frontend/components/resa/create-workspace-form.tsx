"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

const restaurantSchema = z.object({
  name: z.string().min(1, "Workplace name is required").max(255, "Name must be less than 255 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional().or(z.literal("")),
})

type RestaurantFormData = z.infer<typeof restaurantSchema>

interface CreateWorkspaceFormProps {
  onSuccess?: (restaurant: any) => void
  mode?: "create" | "edit"
  restaurantId?: number
  initialData?: RestaurantFormData
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateWorkspaceForm({
  onSuccess,
  mode = "create",
  restaurantId,
  initialData,
  isOpen: externalOpen,
  onOpenChange,
}: CreateWorkspaceFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Use external open state if provided, otherwise use internal state
  const dialogOpen = externalOpen !== undefined ? externalOpen : open
  const setDialogOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setOpen(newOpen)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: initialData || {
      name: "",
      address: "",
      phone: "",
    },
  })

  // Fetch restaurant data when in edit mode and dialog opens
  useEffect(() => {
    if (mode === "edit" && restaurantId && dialogOpen) {
      const fetchRestaurant = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const res = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}`)

          if (!res.ok) {
            throw new Error(`Failed to fetch restaurant (${res.status})`)
          }

          const response = await res.json()
          console.log("Fetched restaurant for editing:", response)

          // Extract restaurant from response (API wraps it in {data: {...}})
          const restaurant = response.data || response

          // Pre-fill the form with restaurant data using reset() to properly update all fields
          reset({
            name: restaurant.name || "",
            address: restaurant.address || "",
            phone: restaurant.phone || "",
          })
        } catch (err: any) {
          console.error("Error fetching restaurant:", err)
          setError(err?.message || "Failed to load restaurant details")
        } finally {
          setIsLoading(false)
        }
      }

      fetchRestaurant()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, restaurantId, dialogOpen])

  const onSubmit = async (data: RestaurantFormData) => {
    setError(null)

    try {
      // Validate restaurantId is present in edit mode
      if (mode === "edit" && !restaurantId) {
        throw new Error("Restaurant ID is required for updating")
      }

      // Prepare payload - only include phone if it has a value
      const payload: any = {
        name: data.name,
        address: data.address,
      }

      if (data.phone && data.phone.trim() !== "") {
        payload.phone = data.phone
      }

      // Determine endpoint and method based on mode
      const isEdit = mode === "edit"
      const endpoint = isEdit ? `${getApiBase()}/restaurants/${restaurantId}` : `${getApiBase()}/restaurants`
      const method = isEdit ? "PATCH" : "POST"
      const successMessage = isEdit ? "updating" : "creating"

      // Log the request for debugging
      console.log(`${method} request to:`, endpoint)
      console.log("Payload:", payload)

      // Use centralized auth fetch function
      const res = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log(`Response status: ${res.status}`)

      if (!res.ok) {
        let message = `Failed to ${successMessage} restaurant`
        try {
          const text = await res.text()
          console.error("Error response:", text)
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      const restaurant = await res.json()

      reset()
      setDialogOpen(false)

      if (onSuccess) {
        onSuccess(restaurant)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    }
  }

  const handleDelete = async () => {
    if (!restaurantId) {
      setError("Restaurant ID is required for deletion")
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const endpoint = `${getApiBase()}/restaurants/${restaurantId}`
      console.log(`DELETE request to:`, endpoint)

      const res = await fetchWithAuth(endpoint, {
        method: "DELETE",
      })

      console.log(`Delete response status: ${res.status}`)

      if (!res.ok) {
        let message = "Failed to delete restaurant"
        try {
          const text = await res.text()
          console.error("Error response:", text)
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      // Success - restaurant deleted (204 No Content)
      setShowDeleteConfirm(false)
      setDeleteConfirmText("")
      setDialogOpen(false)
      reset()

      // Notify parent component of successful deletion
      if (onSuccess) {
        onSuccess(null)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to delete restaurant. Please try again.")
      setShowDeleteConfirm(false)
      setDeleteConfirmText("")
    } finally {
      setIsDeleting(false)
    }
  }

  const isEditMode = mode === "edit"
  const dialogTitle = isEditMode ? "Edit Workplace" : "Create New Workplace"
  const dialogDescription = isEditMode
    ? "Update workplace information."
    : "Add a new workplace to manage schedules and employees."
  const submitButtonText = isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Workplace" : "Create Workplace")

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(error || isLoading) && (
            <p className="text-sm text-red-600">{error || "Loading workplace details..."}</p>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Workplace Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Joe's Pizza"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, State 12345"
                {...register("address")}
              />
              {errors.address ? (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              ) : (
                <FieldDescription>
                  Full street address including city and state
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="+1-555-123-4567 (optional)"
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              ) : (
                <FieldDescription>
                  Optional contact number for the workplace
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-between gap-3">
            {isEditMode ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {submitButtonText}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open)
          if (!open) {
            setDeleteConfirmText("")
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workplace and all associated data including employees, roles, schedules, and shifts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <FieldLabel htmlFor="delete-confirm">
              Type <span className="font-semibold">"GOODBYE FOREVER"</span> to confirm
            </FieldLabel>
            <Input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="GOODBYE FOREVER"
              className="mt-2"
              disabled={isDeleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmText !== "GOODBYE FOREVER"}
              className="bg-destructive text-destructive-foreground text-white hover:bg-destructive/80"
            >
              {isDeleting ? "Deleting..." : "Delete Workplace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
