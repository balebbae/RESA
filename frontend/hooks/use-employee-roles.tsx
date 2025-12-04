"use client";

import { useState, useCallback, useEffect } from "react";
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

  /**
   * Fetch roles for all employees in parallel
   */
  const fetchAllEmployeeRoles = useCallback(async () => {
    if (!restaurantId || employees.length === 0) {
      setEmployeesWithRoles(new Map());
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    const rolesMap = new Map<number, Role[]>();

    try {
      // Fetch roles for each employee in parallel
      await Promise.all(
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
              rolesMap.set(employee.id, roles);
            } else {
              // Set empty array for failed fetches
              rolesMap.set(employee.id, []);
            }
          } catch (error) {
            console.error(
              `Failed to fetch roles for employee ${employee.id}:`,
              error
            );
            rolesMap.set(employee.id, []);
          }
        })
      );

      setEmployeesWithRoles(rolesMap);
    } catch (error) {
      console.error("Error fetching employee roles:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch employee roles"
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, employees]);

  // Fetch roles when enabled and map is empty
  useEffect(() => {
    if (enabled && employeesWithRoles.size === 0) {
      fetchAllEmployeeRoles();
    }
  }, [enabled, employeesWithRoles.size, fetchAllEmployeeRoles]);

  return {
    employeesWithRoles,
    isLoading,
    error,
    refetch: fetchAllEmployeeRoles,
  };
}
