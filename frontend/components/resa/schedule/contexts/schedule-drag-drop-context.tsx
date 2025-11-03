"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { EmployeeDragData, TimeSlotDropData } from "../types/schedule";

interface ScheduleDragDropContextType {
  activeDragData: EmployeeDragData | null;
  setActiveDragData: (data: EmployeeDragData | null) => void;
  registerShiftCreationHandler: (handler: ShiftCreationHandler) => void;
  unregisterShiftCreationHandler: () => void;
  getShiftCreationHandler: () => ShiftCreationHandler | null;
}

export type ShiftCreationHandler = (
  employeeData: EmployeeDragData,
  timeSlotData: TimeSlotDropData
) => void;

const ScheduleDragDropContext = createContext<ScheduleDragDropContextType | null>(null);

interface ScheduleDragDropProviderProps {
  children: ReactNode;
}

/**
 * Provider for managing drag-and-drop state across the schedule interface.
 * This allows the layout (which contains the DndContext) to coordinate with
 * the calendar component (which manages shift state).
 */
export function ScheduleDragDropProvider({ children }: ScheduleDragDropProviderProps) {
  const [activeDragData, setActiveDragData] = useState<EmployeeDragData | null>(null);
  const [shiftCreationHandler, setShiftCreationHandler] = useState<ShiftCreationHandler | null>(
    null
  );

  const registerShiftCreationHandler = useCallback((handler: ShiftCreationHandler) => {
    setShiftCreationHandler(() => handler);
  }, []);

  const unregisterShiftCreationHandler = useCallback(() => {
    setShiftCreationHandler(null);
  }, []);

  const getShiftCreationHandler = useCallback(() => {
    return shiftCreationHandler;
  }, [shiftCreationHandler]);

  return (
    <ScheduleDragDropContext.Provider
      value={{
        activeDragData,
        setActiveDragData,
        registerShiftCreationHandler,
        unregisterShiftCreationHandler,
        getShiftCreationHandler,
      }}
    >
      {children}
    </ScheduleDragDropContext.Provider>
  );
}

/**
 * Hook to access the schedule drag-drop context
 */
export function useScheduleDragDrop() {
  const context = useContext(ScheduleDragDropContext);
  if (!context) {
    throw new Error("useScheduleDragDrop must be used within ScheduleDragDropProvider");
  }
  return context;
}
