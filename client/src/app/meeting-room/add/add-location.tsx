"use client";

import { useState } from "react";

import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LocationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (location: string) => void;
};

export default function LocationModal({
  open,
  onOpenChange,
  onConfirm,
}: LocationModalProps) {
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleConfirm = () => {
    if (!location.trim()) {
      setError("Location is required");
      return;
    }

    onConfirm(location.trim());
    setLocation("");
    setError(undefined);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setLocation("");
      setError(undefined);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom location</DialogTitle>
        </DialogHeader>

        <InputField
          name="customLocation"
          label="Location"
          placeholder="Enter location"
          value={location}
          onChange={(value) => {
            setLocation(value);
            setError(undefined);
          }}
          error={error}
          required
        />

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>

          <Button onClick={handleConfirm}>Use location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
