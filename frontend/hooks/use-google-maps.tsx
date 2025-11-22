"use client"

import { useLoadScript } from "@react-google-maps/api"
import { useEffect, useMemo } from "react"

// Define libraries as a constant outside component to prevent re-renders
const libraries: ("places")[] = ["places"]

/**
 * Hook for loading Google Maps JavaScript API
 * Provides loading state and error handling for Places Autocomplete
 */
export function useGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || "",
    libraries,
    // Prevent loading twice in development (React StrictMode)
    preventGoogleFontsLoading: true,
  })

  // Log errors and warnings in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (loadError) {
        console.error("❌ Google Maps API load error:", loadError)
      }

      if (!apiKey) {
        console.warn(
          "⚠️  Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.\n" +
          "   Places Autocomplete will not work.\n" +
          "   Add your API key to .env.local"
        )
      }
    }
  }, [loadError, apiKey])

  const status = useMemo(() => {
    if (loadError) return "error"
    if (!apiKey) return "missing-key"
    if (isLoaded) return "ready"
    return "loading"
  }, [isLoaded, loadError, apiKey])

  return {
    isLoaded,
    loadError,
    isReady: isLoaded && !loadError && !!apiKey,
    hasApiKey: !!apiKey,
    status,
  }
}
