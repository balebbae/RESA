"use client"

import { Building2, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export interface Restaurant {
  id: number
  employer_id: number
  name: string
  address: string
  phone: string | null
  created_at: string
  updated_at: string
  version: number
}

interface RestaurantCardProps {
  restaurant: Restaurant
  onClick?: (restaurant: Restaurant) => void
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const createdDate = new Date(restaurant.created_at)
  const relativeTime = formatDistanceToNow(createdDate, { addSuffix: true })

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group rounded-lg"
      onClick={() => onClick?.(restaurant)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
              <Building2 className="text-primary h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{restaurant.name}</CardTitle>
              <CardDescription className="text-xs">
                Created {relativeTime}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            ID: {restaurant.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="text-muted-foreground text-sm">{restaurant.address}</p>
        </div>
        {restaurant.phone && (
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <p className="text-muted-foreground text-sm">{restaurant.phone}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
