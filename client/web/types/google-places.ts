/**
 * Google Places Autocomplete type definitions
 * Used for address input with autocomplete functionality
 */

export interface PlaceDetails {
  placeId: string
  formattedAddress: string
  name?: string

  // Structured address components
  streetNumber?: string
  route?: string              // Street name
  locality?: string           // City
  administrativeArea?: string // State/Province
  postalCode?: string
  country?: string

  // Geographic coordinates
  lat?: number
  lng?: number
}

export interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string, details?: PlaceDetails) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

/**
 * Helper to parse Google Place address components into structured format
 * Works with google.maps.places.PlaceResult from Places API
 */
export function parsePlaceDetails(place: google.maps.places.PlaceResult): PlaceDetails {
  const components: Record<string, string> = {}

  // Parse address components
  const addressComponents = place.address_components || []

  addressComponents.forEach((component) => {
    const types = component.types

    if (types.includes('street_number')) {
      components.streetNumber = component.long_name
    }
    if (types.includes('route')) {
      components.route = component.long_name
    }
    if (types.includes('locality')) {
      components.locality = component.long_name
    }
    if (types.includes('administrative_area_level_1')) {
      components.administrativeArea = component.short_name
    }
    if (types.includes('postal_code')) {
      components.postalCode = component.long_name
    }
    if (types.includes('country')) {
      components.country = component.short_name
    }
  })

  // Extract place ID, address, and name
  const placeId = place.place_id || ''
  const formattedAddress = place.formatted_address || ''
  const name = place.name

  // Extract geographic coordinates from geometry.location
  // Note: geometry.location is a google.maps.LatLng object with lat() and lng() methods
  let lat: number | undefined
  let lng: number | undefined

  if (place.geometry?.location) {
    lat = place.geometry.location.lat()
    lng = place.geometry.location.lng()
  }

  return {
    placeId,
    formattedAddress,
    name,
    ...components,
    lat,
    lng,
  }
}
