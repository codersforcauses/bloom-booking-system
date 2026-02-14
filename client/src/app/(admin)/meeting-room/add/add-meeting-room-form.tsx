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

import AmenityModal from "./add-amenities";
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
    clearErrors,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMeetingRoomFormInput>({
    resolver: zodResolver(AddMeetingRoomSchema),
    defaultValues: {
      title: "",
      seats: 0,
      location: "",
      amenities: [],
      image: "",
      start_datetime: "",
      end_datetime: "",
      recurrence_rule: "",
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

  // Fetch amenities from API
  const { data: amenitiesFromAPI = [], refetch: refetchAmenities } =
    RoomAPI.useFetchRoomAmenities({
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
      const capacityId =
        typeof values.seats === "string"
          ? parseInt(values.seats, 10)
          : values.seats;

      // Use FormData for multipart file upload
      const formDataMultipart = new FormData();
      formDataMultipart.append("name", values.title);
      formDataMultipart.append("is_active", "true"); // TODO: need to check with team
      formDataMultipart.append("location_id", locationId.toString());
      formDataMultipart.append("capacity", capacityId.toString());
      formDataMultipart.append("start_datetime", values.start_datetime);
      formDataMultipart.append("end_datetime", values.end_datetime);
      if (values.recurrence_rule) {
        formDataMultipart.append("recurrence_rule", values.recurrence_rule);
      }
      if (imageFile) {
        formDataMultipart.append("img", imageFile);
      }

      if (Array.isArray(values.amenities) && values.amenities.length > 0) {
        formDataMultipart.append(
          "amenities_ids",
          JSON.stringify(values.amenities.map(Number)),
        );
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
      seats: 0,
      location: "",
      amenities: [],
      image: "",
      start_datetime: "",
      end_datetime: "",
      recurrence_rule: "",
    });
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setRepeat("");
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
            <div className="space-y-6">
              {/* Row 1: Name, Location and Seat Capacity */}
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

                <InputField
                  kind="number"
                  name="seats"
                  label="Seat Capacity"
                  placeholder="Capacity"
                  value={formValues.seats?.toString() || ""}
                  onChange={(value) =>
                    handleInputChange("seats", parseInt(value) || 0)
                  }
                  min={1}
                  required
                  error={errors.seats?.message}
                />
              </div>

              {/* Row 2: Amenities + Upload Image */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Amenities Section - Using Badge Component */}
                <div>
                  <InputField
                    kind="badge"
                    name="amenities"
                    label="Amenities"
                    options={amenitiesFromAPI.map((a) => a.name)}
                    value={
                      Array.isArray(formValues.amenities)
                        ? formValues.amenities.map((amenityId) => {
                            const numericId =
                              typeof amenityId === "string"
                                ? parseInt(amenityId, 10)
                                : amenityId;
                            const amenity = amenitiesFromAPI.find(
                              (a) => a.id === numericId,
                            );
                            return amenity?.name || `Amenity ${amenityId}`;
                          })
                        : []
                    }
                    onChange={(selectedNames) => {
                      const selectedIds = selectedNames
                        .map((name) => {
                          const amenity = amenitiesFromAPI.find(
                            (a) => a.name === name,
                          );
                          return amenity ? amenity.id.toString() : null;
                        })
                        .filter((id): id is string => id !== null);
                      setValue("amenities", selectedIds, { shouldDirty: true });
                    }}
                    actionElement={
                      <Button
                        type="button"
                        onClick={() => setAddAmenityOpen(true)}
                        className="caption inline-flex h-auto items-center rounded-md border bg-[hsl(var(--secondary))] px-2 py-0.5 text-[hsl(var(--card-foreground))]"
                      >
                        + Add
                      </Button>
                    }
                  />
                </div>

                <AmenityModal
                  open={addAmenityOpen}
                  onClose={() => setAddAmenityOpen(false)}
                  onSelect={(amenityId) => {
                    const newAmenityId =
                      typeof amenityId === "number"
                        ? amenityId.toString()
                        : amenityId;
                    const currentAmenities = Array.isArray(formValues.amenities)
                      ? formValues.amenities
                      : [];
                    setValue("amenities", [...currentAmenities, newAmenityId], {
                      shouldDirty: true,
                    });
                    setAddAmenityOpen(false);
                  }}
                  onAmenitiesChanged={async () => {
                    const refreshed = await refetchAmenities();
                    const refreshedAmenities =
                      refreshed.data?.results ?? amenitiesFromAPI;
                    const validAmenityIds = new Set(
                      refreshedAmenities.map((amenity: AmenityResponse) =>
                        amenity.id.toString(),
                      ),
                    );
                    const currentAmenities = Array.isArray(formValues.amenities)
                      ? formValues.amenities
                      : [];
                    const nextAmenities = currentAmenities
                      .map((amenityId) => amenityId.toString())
                      .filter((amenityId) => validAmenityIds.has(amenityId));
                    setValue("amenities", nextAmenities, { shouldDirty: true });
                  }}
                />
                {/* Upload Image */}
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

                        // Validate file size (5MB limit)
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (file.size > maxSize) {
                          setError("image", {
                            type: "manual",
                            message: "Image must be under 5MB",
                          });
                          return;
                        }

                        // Clear error if file is valid
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

              {/* Row 3: Date and Time Slots */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <InputField
                  kind="date"
                  name="date"
                  label="Date"
                  placeholder="DD/MM/YYYY"
                  value={
                    formValues.start_datetime
                      ? new Date(formValues.start_datetime as string)
                      : undefined
                  }
                  onChange={(value) => {
                    if (!value) return;
                    // Combine with existing time or use 09:00
                    const dateStr = value.toISOString().split("T")[0];
                    const time = formValues.start_datetime
                      ? (formValues.start_datetime as string).split("T")[1] ||
                        "09:00"
                      : "09:00";
                    const datetime = `${dateStr}T${time}`;
                    handleInputChange("start_datetime", datetime);
                  }}
                />

                <InputField
                  kind="time-select"
                  name="timeSlotStart"
                  label="Time Slot Start"
                  placeholder="Select"
                  value={
                    formValues.start_datetime
                      ? (formValues.start_datetime as string)
                          .split("T")[1]
                          ?.slice(0, 5) || ""
                      : ""
                  }
                  onChange={(value) => {
                    // Combine with existing date
                    const date = formValues.start_datetime
                      ? (formValues.start_datetime as string).split("T")[0]
                      : new Date().toISOString().split("T")[0];
                    const datetime = `${date}T${value}`;
                    handleInputChange("start_datetime", datetime);
                  }}
                />

                <InputField
                  kind="time-select"
                  name="timeSlotEnd"
                  label="Time Slot End"
                  placeholder="Select"
                  value={
                    formValues.end_datetime
                      ? (formValues.end_datetime as string)
                          .split("T")[1]
                          ?.slice(0, 5) || ""
                      : ""
                  }
                  onChange={(value) => {
                    // Use same date as start time
                    const date = formValues.start_datetime
                      ? (formValues.start_datetime as string).split("T")[0]
                      : new Date().toISOString().split("T")[0];
                    const datetime = `${date}T${value}`;
                    handleInputChange("end_datetime", datetime);
                  }}
                />
              </div>

              {/* Row 5: Repeat dropdown */}
              <div className="max-w-xs">
                <InputField
                  kind="select"
                  name="repeat"
                  label="Repeat"
                  placeholder="Does not repeat"
                  value={repeat}
                  options={[
                    { label: "Does not repeat", value: "none" },
                    { label: "Daily", value: "daily" },
                    { label: "Weekly", value: "weekly" },
                    { label: "Custom", value: "custom" },
                  ]}
                  onChange={(value) => {
                    setRepeat(value);

                    // Convert to RRULE format
                    const rruleMap: Record<string, string> = {
                      none: "",
                      daily: "FREQ=DAILY",
                      weekly: "FREQ=WEEKLY",
                      custom: "", // Will be set by modal
                    };
                    handleInputChange("recurrence_rule", rruleMap[value] || "");

                    if (value === "custom") {
                      setShowCustomRepeat(true);
                    }
                  }}
                  error={errors.recurrence_rule?.message}
                />

                {showCustomRepeat && (
                  <CustomRepeatModal
                    open={showCustomRepeat}
                    onClose={() => {
                      setShowCustomRepeat(false);
                      setRepeat("");
                    }}
                    onDone={(value: CustomRepeatValue) => {
                      setRepeat("custom");

                      // Convert custom repeat to RRULE format
                      const freqMap: Record<string, string> = {
                        day: "DAILY",
                        week: "WEEKLY",
                        month: "MONTHLY",
                      };
                      const freq = freqMap[value.frequency];
                      if (!freq) {
                        // Unknown frequency (e.g., 'year') - do not set an RRULE
                        handleInputChange("recurrence_rule", "");
                        setShowCustomRepeat(false);
                        return;
                      }
                      let rrule = `FREQ=${freq}`;

                      if (value.interval && value.interval !== "1") {
                        rrule += `;INTERVAL=${value.interval}`;
                      }

                      // For weekly frequency, list BYDAY values (MO,TU,WE...)
                      if (value.frequency === "week" && value.days?.length) {
                        // Convert day abbreviations to RRULE format (MO, TU, WE, etc.)
                        const dayMap: Record<string, string> = {
                          mon: "MO",
                          tue: "TU",
                          wed: "WE",
                          thu: "TH",
                          fri: "FR",
                          sat: "SA",
                          sun: "SU",
                        };
                        const byday = value.days
                          .map((d: string) => dayMap[d] || d)
                          .join(",");
                        rrule += `;BYDAY=${byday}`;
                      }

                      // Add end condition
                      if (value.endType === "on" && value.endDate) {
                        // Use a UTC datetime (YYYYMMDDT000000Z) for UNTIL to match backend
                        // expectations and RFC5545 datetime format for timed recurrences.
                        const endDate = new Date(value.endDate);
                        const endDateStr =
                          endDate
                            .toISOString()
                            .split("T")[0]
                            .replace(/-/g, "") + "T000000Z";
                        rrule += `;UNTIL=${endDateStr}`;
                      } else if (
                        value.endType === "after" &&
                        value.occurrences
                      ) {
                        rrule += `;COUNT=${value.occurrences}`;
                      }

                      handleInputChange("recurrence_rule", rrule);
                      setShowCustomRepeat(false);
                    }}
                  />
                )}
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
