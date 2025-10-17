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
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").max(255, "Name must be less than 255 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional().or(z.literal("")),
})

type RestaurantFormData = z.infer<typeof restaurantSchema>

interface CreateRestaurantCardProps {
  onSuccess?: (restaurant: any) => void
}

export function CreateRestaurantCard({ onSuccess }: CreateRestaurantCardProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
  })

  const onSubmit = async (data: RestaurantFormData) => {
    setError(null)

    try {
      // Prepare payload - only include phone if it has a value
      const payload: any = {
        name: data.name,
        address: data.address,
      }

      if (data.phone && data.phone.trim() !== "") {
        payload.phone = data.phone
      }

      // Use centralized auth fetch function
      const res = await fetchWithAuth(`${getApiBase()}/restaurants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = "Failed to create restaurant"
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      const restaurant = await res.json()

      reset()
      setOpen(false)

      if (onSuccess) {
        onSuccess(restaurant)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-muted/30 hover:bg-muted/50 group flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 transition-all hover:border-muted-foreground/40">
          <div className="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
            <Plus className="text-primary h-6 w-6" />
          </div>
          <div className="flex flex-col items-center gap-1 px-4">
            <h3 className="text-base font-semibold">Add Restaurant</h3>
            <p className="text-muted-foreground text-center text-xs">
              Create a new restaurant
            </p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Restaurant</DialogTitle>
          <DialogDescription>
            Add a new restaurant to manage schedules and employees.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Restaurant Name</FieldLabel>
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
                  Optional contact number for the restaurant
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setError(null)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
