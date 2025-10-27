"use client"

import React, { createContext, useContext, useState } from "react"

/**
 * Restaurant context for tracking the currently selected workplace
 * Used by left sidebar to set selection and right sidebar to display employees
 */

interface RestaurantContextType {
  selectedRestaurantId: number | null
  selectedRestaurantName: string | null
  setSelectedRestaurant: (id: number | null, name?: string | null) => void
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null)
  const [selectedRestaurantName, setSelectedRestaurantName] = useState<string | null>(null)

  const setSelectedRestaurant = (id: number | null, name: string | null = null) => {
    setSelectedRestaurantId(id)
    setSelectedRestaurantName(name)
  }

  const value: RestaurantContextType = {
    selectedRestaurantId,
    selectedRestaurantName,
    setSelectedRestaurant,
  }

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>
}

/**
 * Hook to access restaurant context
 * Must be used within RestaurantProvider
 */
export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider")
  }
  return context
}
