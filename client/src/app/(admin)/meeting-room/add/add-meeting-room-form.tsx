"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { type FieldPath, type FieldPathValue, useForm } from "react-hook-form";

import { AlertDialog } from "@/components/alert-dialog";
import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RoomAPI from "@/hooks/room";
import api from "@/lib/api";
import type { AmenityResponse } from "@/lib/api-types";

import LocationModal from "./add-location";
import CustomRepeatModal from "./custom-repeat";
import {
  type AddMeetingRoomFormInput,
  AddMeetingRoomSchema,
  type CustomRepeatValue,
} from "./schemas";

export default function AddMeetingRoomForm() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [repeat, setRepeat] = useState<string>("");
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);

  const ADD_LOCATION_VALUE = "__add_location__";
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  const [addAmenityOpen, setAddAmenityOpen] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    getValues,
    clearErrors,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMeetingRoomFormInput>({
    resolver: zodResolver(AddMeetingRoomSchema),
    defaultValues: {
      title: "",
      location: "",
      image: "",
    },
    mode: "onSubmit",
  });

  const formValues = watch();

  // Fetch locations dynamically
  const { data: locations = [], refetch: refetchLocations } =
    RoomAPI.useFetchRoomLocations({
      page: 1,
      nrows: 100,
    });

  const handleInputChange = <TField extends FieldPath<AddMeetingRoomFormInput>>(
    field: TField,
    value: FieldPathValue<AddMeetingRoomFormInput, TField>,
  ) => {
    setValue(field, value, { shouldDirty: true });
    clearErrors(field);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const locationValue =
        typeof values.location === "string"
          ? values.location
          : String(values.location);
      const locationId = parseInt(locationValue, 10);

      // Use FormData for multipart file upload
      const formDataMultipart = new FormData();
      formDataMultipart.append("name", values.title);
      formDataMultipart.append("location_id", locationId.toString());

      if (imageFile) {
        formDataMultipart.append("img", imageFile);
      }

      await api.post("/rooms/", formDataMultipart);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to add room:", error);
      alert("Failed to add room. Please try again.");
    }
  });

  const handleCancel = () => {
    reset({
      title: "",
      location: "",
      image: "",
    });
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Build dynamic location options
  const locationOptions = [
    ...locations.map((l) => ({ label: l.name, value: l.id.toString() })),
    { label: "+ Add location", value: ADD_LOCATION_VALUE },
  ];

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold">Meeting Rooms</h2>

          <Card className="w-full bg-white p-8 shadow-sm">
            {/* Row 1: Name, Location */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <InputField
                  kind="text"
                  name="name"
                  label="Name"
                  placeholder="Name"
                  value={formValues.title || ""}
                  onChange={(value) => handleInputChange("title", value)}
                  required
                  error={errors.title?.message}
                />

                <InputField
                  kind="select"
                  name="location"
                  label="Location"
                  placeholder="Select location"
                  value={
                    typeof formValues.location === "number"
                      ? formValues.location.toString()
                      : (formValues.location ?? "")
                  }
                  onChange={(value) => {
                    if (value === ADD_LOCATION_VALUE) {
                      // Reset to empty to keep placeholder visible
                      setValue("location", "", { shouldDirty: true });
                      clearErrors("location");
                      setAddLocationOpen(true);
                      return;
                    }
                    handleInputChange("location", value);
                  }}
                  options={locationOptions}
                  required
                  error={errors.location?.message}
                />

                <LocationModal
                  open={addLocationOpen}
                  onClose={() => setAddLocationOpen(false)}
                  onSelect={(location) => {
                    // Refetch to update the locations list with the new location
                    refetchLocations();
                    // Auto-select the newly created location for convenience.
                    const locationValue =
                      typeof location === "number"
                        ? location.toString()
                        : location;
                    setValue("location", locationValue, { shouldDirty: true });
                    clearErrors("location");
                    setAddLocationOpen(false);
                  }}
                />

                <div className="space-y-2">
                  <label htmlFor="image" className="body-sm-bold block">
                    Upload Image
                  </label>

                  <div className="flex items-stretch overflow-hidden rounded-md border bg-background shadow-bloom-input">
                    <div className="body flex flex-1 items-center overflow-hidden px-3 py-2">
                      <span
                        className="truncate text-bloom-gray"
                        title={imageFile ? imageFile.name : "No file selected"}
                      >
                        {imageFile ? imageFile.name : "No file selected"}
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={() => document.getElementById("image")?.click()}
                      className="rounded-l-none rounded-r-md text-white"
                    >
                      Choose File
                    </Button>

                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={imageInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setImageFile(null);
                          return;
                        }

                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (file.size > maxSize) {
                          setError("image", {
                            type: "manual",
                            message: "Image must be under 5MB",
                          });
                          setImageFile(null);
                          if (imageInputRef.current)
                            imageInputRef.current.value = "";
                          return;
                        }

                        clearErrors("image");
                        setImageFile(file);
                      }}
                    />
                  </div>

                  {errors.image?.message && (
                    <p className="caption text-bloom-red">
                      {errors.image.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  variant="outline"
                >
                  Clear
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="text-white"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <AlertDialog
        open={showSuccessDialog}
        variant="success"
        title="Awesome!"
        description="Your request for meeting room creation was successful"
        onConfirm={() => {
          // Clear form state before navigating away so the form is clean on next use.
          handleCancel();
          setShowSuccessDialog(false);
          router.push("/meeting-room");
        }}
      />
    </>
  );
}
