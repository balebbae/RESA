"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import {
  parsePlaceDetails,
  type PlacesAutocompleteProps,
} from "@/types/google-places"
import { MapPin } from "lucide-react"

/**
 * Google Places Autocomplete Input Component with Custom Dropdown
 * Uses Autocomplete Service API with fully custom ShadCN-styled dropdown
 * Prevents modal closing issues and provides full styling control
 */
export function PlacesAutocompleteInput({
  value,
  onChange,
  onBlur,
  placeholder = "Start typing to search for an address...",
  disabled = false,
  error,
}: PlacesAutocompleteProps) {
  const { isReady, status, hasApiKey } = useGoogleMaps()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  const [inputValue, setInputValue] = useState(value)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  // Sync external value changes (e.g., form reset in edit mode)
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Initialize Google Places Services
  useEffect(() => {
    if (!isReady) return

    try {
      // Autocomplete Service for predictions
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()

      // Places Service for getting full place details (needs a div element)
      const div = document.createElement('div')
      placesServiceRef.current = new google.maps.places.PlacesService(div)
    } catch (err) {
      console.error("Failed to initialize Google Places Services:", err)
    }
  }, [isReady])

  // Fetch predictions when input changes
  const fetchPredictions = useCallback((query: string) => {
    if (!query.trim() || !autocompleteServiceRef.current) {
      setPredictions([])
      setIsDropdownOpen(false)
      return
    }

    setIsLoading(true)

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Change to support other countries if needed
      },
      (results, status) => {
        setIsLoading(false)

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results)
          setIsDropdownOpen(true)
          setSelectedIndex(-1)
        } else {
          setPredictions([])
          setIsDropdownOpen(false)
        }
      }
    )
  }, [])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue) // Update form immediately
    fetchPredictions(newValue)
  }

  // Get full place details and update form
  const selectPlace = useCallback((placeId: string, description: string) => {
    if (!placesServiceRef.current) return

    // Immediately update UI
    setInputValue(description)
    setIsDropdownOpen(false)
    setPredictions([])

    // Fetch full place details
    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: [
          'formatted_address',
          'address_components',
          'geometry',
          'place_id',
          'name',
        ],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const formattedAddress = place.formatted_address || description
          const details = parsePlaceDetails(place)

          // Update form with full details
          onChange(formattedAddress, details)

          if (process.env.NODE_ENV === 'development') {
            console.log('📍 Place selected:', {
              address: formattedAddress,
              details,
            })
          }
        } else {
          // Fallback to description if details fetch fails
          onChange(description)
        }
      }
    )
  }, [onChange])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || predictions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          const prediction = predictions[selectedIndex]
          selectPlace(prediction.place_id, prediction.description)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsDropdownOpen(false)
        setPredictions([])
        setSelectedIndex(-1)
        break
    }
  }

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
        setPredictions([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle input blur
  const handleBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      if (onBlur) {
        onBlur()
      }
    }, 200)
  }

  // Handle different loading states
  if (!hasApiKey) {
    return (
      <div>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="Enter address manually"
          disabled={disabled}
          aria-invalid={!!error}
        />
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-1 text-xs text-amber-600">
            ⚠️ Google Maps API key not configured. Autocomplete disabled.
          </p>
        )}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="Enter address manually"
          disabled={disabled}
          aria-invalid={!!error}
        />
        <p className="mt-1 text-xs text-red-600">
          Failed to load address autocomplete. Enter address manually.
        </p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <Input
        ref={inputRef}
        value={inputValue}
        placeholder="Loading Google Maps..."
        disabled={true}
      />
    )
  }

  // Render input with custom dropdown
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (predictions.length > 0) {
            setIsDropdownOpen(true)
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        autoComplete="off"
      />

      {/* Custom Dropdown - ShadCN styled */}
      {isDropdownOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
          onMouseDown={(e) => {
            // Prevent blur when clicking dropdown
            e.preventDefault()
          }}
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => {
                  selectPlace(prediction.place_id, prediction.description)
                }}
                className={`
                  w-full flex items-start gap-2 px-2 py-2 text-sm text-left rounded-sm
                  transition-colors cursor-pointer
                  ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Google Attribution */}
          <div className="border-t border-border px-2 py-1.5 bg-muted/50">
            <p className="text-[10px] text-muted-foreground text-right">
              Powered by Google
            </p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
    </div>
  )
}
