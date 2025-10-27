"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { Employee, UseEmployeesReturn } from "@/components/resa/sidebar-right/types/employee"

/**
 * Custom hook for fetching and managing employees for a specific restaurant
 * Similar to use-workplaces but scoped to a restaurant ID
 */
export function useEmployees(restaurantId: number | null): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    if (!restaurantId) {
      setEmployees([])
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const apiUrl = `${getApiBase()}/restaurants/${restaurantId}/employees`

      const res = await fetchWithAuth(apiUrl)

      if (!res.ok) {
        throw new Error(`Failed to fetch employees (${res.status})`)
      }

      const data = await res.json()
      const employeeList = Array.isArray(data) ? data : (data.data || [])

      // Ensure all employees have required fields
      const validEmployees: Employee[] = employeeList
        .filter((emp: unknown) => emp && typeof emp === 'object' && 'id' in emp)
        .map((emp: unknown) => {
          const e = emp as Record<string, unknown>
          return {
            id: e.id as number,
            restaurant_id: e.restaurant_id as number,
            full_name: (e.full_name as string) || "Unnamed Employee",
            email: (e.email as string) || "",
            created_at: e.created_at as string,
            updated_at: e.updated_at as string,
          }
        })

      setEmployees(validEmployees)
    } catch (err) {
      console.error("Error fetching employees:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch employees")
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees,
  }
}
