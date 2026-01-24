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
          <DialogTitle className="text-center">Location</DialogTitle>
        </DialogHeader>

        <InputField
          name="customLocation"
          label="Enter location name"
          placeholder="Name"
          value={location}
          onChange={(value) => {
            setLocation(value);
            setError(undefined);
          }}
          error={error}
          required
        />

        <DialogFooter className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="border-bloom-blue bg-white text-bloom-blue"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>

          <Button className="text-white" onClick={handleConfirm}>
            Ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
