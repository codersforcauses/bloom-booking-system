"use client";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateRoomStatus } from "@/hooks/room";

type Room = {
  id: string | number;
  name: string;
  [key: string]: any;
};

interface StatusDialogProps {
  room: Room;
  action: "setActive" | "setInactive";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const Title = {
  setActive: "Active",
  setInactive: "Inactive",
} as const;

const Status = {
  setActive: "active",
  setInactive: "inactive",
} as const;

export default function StatusDialog({
  room,
  action,
  isOpen,
  onOpenChange,
}: StatusDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate } = useUpdateRoomStatus(
    room.id as number,
    setErrorMessage,
    () => {
      onOpenChange(false);
    },
  );

  const handleStatusChange = () => {
    setErrorMessage(null);
    mutate({
      is_active: action === "setActive" ? true : false,
    });
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="round-md rounded-md border border-border bg-white p-6 max-sm:w-[90%]">
        <DialogTitle className="text-center">
          Set Room {Title[action]}
        </DialogTitle>
        <DialogDescription className="px-4 pt-2">
          Are you sure you want to set the room{" "}
          <span className="font-bold">{room.name}</span> {Status[action]}? Click
          confirm to proceed.
        </DialogDescription>
        <DialogDescription className="px-4">
          {errorMessage && (
            <span className="text-sm text-bloom-red">{errorMessage}</span>
          )}
        </DialogDescription>
        <div className="flex items-center justify-center gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant={action == "setActive" ? "confirm" : "warning"}
            onClick={handleStatusChange}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
