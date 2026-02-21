"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type FieldPath, type FieldPathValue, useForm } from "react-hook-form";

import { AlertDialog } from "@/components/alert-dialog";
import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RoomAPI from "@/hooks/room";
import api from "@/lib/api";
import type { AmenityResponse, RoomResponse } from "@/lib/api-types";

import AmenityModal from "../add/add-amenities";
import LocationModal from "../add/add-location";
import CustomRepeatModal from "../add/custom-repeat";
import {
  type AddMeetingRoomFormInput,
  AddMeetingRoomSchema,
  type CustomRepeatValue,
} from "../add/schemas";

type EditMeetingRoomFormProps = {
  roomId: number;
};

const ADD_LOCATION_VALUE = "__add_location__";

const getRepeatValue = (recurrenceRule?: string) => {
  if (!recurrenceRule) return "none";
  if (recurrenceRule.startsWith("FREQ=DAILY")) return "daily";
  if (recurrenceRule.startsWith("FREQ=WEEKLY")) return "weekly";
  return "custom";
};

const buildInitialValues = (room: RoomResponse): AddMeetingRoomFormInput => ({
  title: room.name ?? "",
  seats: room.capacity ?? 1,
  location: room.location?.id?.toString() ?? "",
  amenities: room.amenities?.map((amenity) => amenity.id.toString()) ?? [],
  image: "",
  start_datetime: room.start_datetime ?? "",
  end_datetime: room.end_datetime ?? "",
  recurrence_rule: room.recurrence_rule ?? "",
});

export default function EditMeetingRoomForm({
  roomId,
}: EditMeetingRoomFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [repeat, setRepeat] = useState<string>("");
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);

  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [addAmenityOpen, setAddAmenityOpen] = useState(false);

  const {
    data: room,
    isLoading: isRoomLoading,
    isError: isRoomError,
    error: roomError,
  } = RoomAPI.useFetchRoom(roomId);

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
      seats: 1,
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

  useEffect(() => {
    if (!room) return;
    reset(buildInitialValues(room));
    setRepeat(getRepeatValue(room.recurrence_rule));
  }, [room, reset]);

  const { data: locations = [], refetch: refetchLocations } =
    RoomAPI.useFetchRoomLocations({
      page: 1,
      nrows: 100,
    });

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
    if (!room) return;
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

      const formDataMultipart = new FormData();
      formDataMultipart.append("name", values.title);
      formDataMultipart.append("is_active", room.is_active ? "true" : "false");
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

      const amenityIds = Array.isArray(values.amenities)
        ? values.amenities.map((amenityId) => amenityId.toString())
        : [];
      formDataMultipart.append("amenities_ids", JSON.stringify(amenityIds));

      await api.patch(`/rooms/${roomId}/`, formDataMultipart);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to update room:", error);
      alert("Failed to update room. Please try again.");
    }
  });

  const handleCancel = () => {
    if (room) {
      reset(buildInitialValues(room));
    } else {
      reset({
        title: "",
        seats: 1,
        location: "",
        amenities: [],
        image: "",
        start_datetime: "",
        end_datetime: "",
        recurrence_rule: "",
      });
    }
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setRepeat(getRepeatValue(room?.recurrence_rule));
  };

  const locationOptions = [
    ...locations.map((l) => ({ label: l.name, value: l.id.toString() })),
    { label: "+ Add location", value: ADD_LOCATION_VALUE },
  ];

  if (isRoomLoading) {
    return <div className="p-6">Loading room details...</div>;
  }

  if (isRoomError) {
    return (
      <div className="p-6 text-bloom-red">
        {roomError instanceof Error
          ? roomError.message
          : "Failed to load room details. Please try again."}
      </div>
    );
  }

  if (!room) {
    return <div className="p-6">Room not found.</div>;
  }

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold">Edit Meeting Room</h2>

          <Card className="w-full bg-white p-8 shadow-sm">
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

                <InputField
                  kind="number"
                  name="seat"
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    const currentAmenities = Array.isArray(
                      getValues("amenities"),
                    )
                      ? getValues("amenities")
                      : [];
                    const nextAmenities = (currentAmenities || [])
                      .map((amenityId) => amenityId.toString())
                      .filter((amenityId) => validAmenityIds.has(amenityId));
                    setValue("amenities", nextAmenities, { shouldDirty: true });
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

                        const maxSize = 5 * 1024 * 1024;
                        if (file.size > maxSize) {
                          setError("image", {
                            type: "manual",
                            message: "Image must be under 5MB",
                          });
                          setImageFile(null);
                          if (imageInputRef.current) {
                            imageInputRef.current.value = "";
                          }
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
                    const dateStr = value.toLocaleDateString("en-CA");
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
                    const date = formValues.start_datetime
                      ? (formValues.start_datetime as string).split("T")[0]
                      : new Date().toISOString().split("T")[0];
                    const datetime = `${date}T${value}`;
                    handleInputChange("end_datetime", datetime);
                  }}
                />
              </div>

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

                    const rruleMap: Record<string, string> = {
                      none: "",
                      daily: "FREQ=DAILY",
                      weekly: "FREQ=WEEKLY",
                      custom: "",
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

                      const freqMap: Record<string, string> = {
                        day: "DAILY",
                        week: "WEEKLY",
                        month: "MONTHLY",
                      };
                      const freq = freqMap[value.frequency];
                      if (!freq) {
                        handleInputChange("recurrence_rule", "");
                        setShowCustomRepeat(false);
                        return;
                      }
                      let rrule = `FREQ=${freq}`;

                      if (value.interval && value.interval !== "1") {
                        rrule += `;INTERVAL=${value.interval}`;
                      }

                      if (value.frequency === "week" && value.days?.length) {
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

                      if (value.endType === "on" && value.endDate) {
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

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  variant="outline"
                >
                  Reset
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="text-white"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <LocationModal
        open={addLocationOpen}
        onClose={() => setAddLocationOpen(false)}
        onSelect={(location) => {
          refetchLocations();
          const locationValue =
            typeof location === "number" ? location.toString() : location;
          setValue("location", locationValue, { shouldDirty: true });
          clearErrors("location");
          setAddLocationOpen(false);
        }}
      />

      <AlertDialog
        open={showSuccessDialog}
        variant="success"
        title="Updated"
        description="Meeting room was updated successfully."
        onConfirm={() => {
          handleCancel();
          setShowSuccessDialog(false);
          router.push("/meeting-room");
        }}
      />
    </>
  );
}
