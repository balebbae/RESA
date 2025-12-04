"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types/role";

interface RoleSelectorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  employeeName: string;
  onSelectRole: (role: Role) => void;
}

export function RoleSelectorDialog({
  isOpen,
  onOpenChange,
  roles,
  employeeName,
  onSelectRole,
}: RoleSelectorDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleConfirm = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Role for {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This employee has multiple roles. Select which role they'll work in
            for this shift:
          </p>

          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                className={`w-full p-3 rounded-md border-2 text-left transition-colors ${
                  selectedRole?.id === role.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{role.name}</Badge>
                  {selectedRole?.id === role.id && (
                    <span className="text-xs text-primary">✓ Selected</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedRole}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
