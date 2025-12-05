"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import { getApiBase } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

interface UseEmployeeRolesProps {
  restaurantId: number | null;
  employees: Employee[];
  enabled: boolean; // Only fetch when popover opens
}

interface UseEmployeeRolesReturn {
  employeesWithRoles: Map<number, Role[]>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and caching employee roles
 * Follows pattern from use-employees.tsx for data fetching
 * Only fetches when enabled (e.g., when popover is open)
 */
export function useEmployeeRoles({
  restaurantId,
  employees,
  enabled,
}: UseEmployeeRolesProps): UseEmployeeRolesReturn {
  const [employeesWithRoles, setEmployeesWithRoles] = useState<
    Map<number, Role[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create stable key from employee IDs to prevent unnecessary re-fetching
  // Only changes when the actual set of employee IDs changes
  const employeeIdsKey = useMemo(
    () => employees.map(e => e.id).sort((a, b) => a - b).join(','),
    [employees]
  );

  /**
   * Fetch roles for employees incrementally
   * Only fetches for new employees not already in cache
   * Preserves existing cached data to prevent flashing
   */
  const fetchAllEmployeeRoles = useCallback(async () => {
    // Handle empty state - clear everything
    if (!restaurantId || employees.length === 0) {
      setEmployeesWithRoles(new Map());
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch roles for all employees in parallel
      const fetchedRoles = await Promise.all(
        employees.map(async (employee) => {
          try {
            const response = await fetchWithAuth(
              `${getApiBase()}/restaurants/${restaurantId}/employees/${
                employee.id
              }/roles`
            );
            if (response.ok) {
              const data = await response.json();
              const roles = Array.isArray(data) ? data : data.data || [];
              return { empId: employee.id, roles };
            } else {
              return { empId: employee.id, roles: [] };
            }
          } catch (error) {
            console.error(
              `Failed to fetch roles for employee ${employee.id}:`,
              error
            );
            return { empId: employee.id, roles: [] };
          }
        })
      );

      // Update map with fetched data, preserving structure to prevent flashing
      setEmployeesWithRoles(prevMap => {
        const newMap = new Map<number, Role[]>();

        // Add all fetched employee roles
        for (const { empId, roles } of fetchedRoles) {
          newMap.set(empId, roles);
        }

        return newMap;
      });

    } catch (error) {
      console.error("Error fetching employee roles:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch employee roles"
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, employeeIdsKey]);

  // Fetch roles when enabled or when employee set actually changes
  useEffect(() => {
    if (enabled) {
      fetchAllEmployeeRoles();
    }
  }, [enabled, fetchAllEmployeeRoles]);

  return {
    employeesWithRoles,
    isLoading,
    error,
    refetch: fetchAllEmployeeRoles,
  };
}
