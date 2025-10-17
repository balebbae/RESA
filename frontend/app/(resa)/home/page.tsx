"use client"

import { CreateRestaurantCard } from "@/components/resa/create-restaurant-form"
import { RestaurantCard, Restaurant } from "@/components/resa/restaurant-card"
import { useEffect, useState } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function Page() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetchWithAuth(`${getApiBase()}/restaurants`)

      if (!res.ok) {
        throw new Error(`Failed to fetch restaurants (${res.status})`)
      }

      const data = await res.json()

      // Handle both array response and object with data property
      const restaurantList = Array.isArray(data) ? data : (data.data || [])
      setRestaurants(restaurantList)
    } catch (err: any) {
      console.error("Error fetching restaurants:", err)
      setError(err?.message || "Failed to load restaurants")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const handleRestaurantCreated = (restaurant: any) => {
    console.log("Restaurant created:", restaurant)
    // Refresh the restaurant list
    fetchRestaurants()
  }

  const handleRestaurantClick = (restaurant: Restaurant) => {
    console.log("Restaurant clicked:", restaurant)
    // TODO: Navigate to restaurant detail page or dashboard
    // router.push(`/restaurants/${restaurant.id}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4">
          <p className="text-sm font-medium">Error loading restaurants</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted/50 h-48 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={handleRestaurantClick}
            />
          ))}
          <CreateRestaurantCard onSuccess={handleRestaurantCreated} />
        </div>
      )}
    </div>
  )
}
