"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Room } from "@/types/card";

export default function AddMeetingRoomForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Room>>({
    title: "",
    seats: 0,
    location: "",
    amenities: [],
    image: "",
    available: true,
    availablility: "",
    bookings: 0,
  });

  // Available amenities
  const availableAmenities = [
    "Audio",
    "Video",
    "HDMI",
    "White Board",
    "Sound System",
  ];

  const handleInputChange = (field: keyof Room, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAmenitiesChange = (value: string[]) => {
    setFormData((prev) => ({ ...prev, amenities: value }));
  };

  const handleImageChange = (value: string) => {
    handleInputChange("image", value);
    setImagePreview(value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Room name is required";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.seats || formData.seats <= 0) {
      newErrors.seats = "Number of seats must be greater than 0";
    }

    if (!formData.image?.trim()) {
      newErrors.image = "Image URL is required";
    }

    if (!formData.availablility?.trim()) {
      newErrors.availablility = "Availability schedule is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add room");
      }

      // Redirect to Meeting Rooms list after adding
      router.push("/meeting-room");
    } catch (error) {
      console.error("Failed to add room:", error);
      alert("Failed to add room. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/meeting-room");
  };

  return (
    <Card className="w-full bg-white p-6 shadow-sm">
      <div className="space-y-6">
        {/* Image URL and Preview */}
        <div>
          <InputField
            kind="text"
            name="image"
            label="Room Image URL"
            placeholder="Enter image URL"
            value={formData.image || ""}
            onChange={handleImageChange}
            required
            error={errors.image}
          />
          {imagePreview && (
            <div className="relative mt-4 h-40 w-full overflow-hidden rounded-md">
              <Image
                src={imagePreview}
                alt="Room preview"
                fill
                className="object-cover"
                onError={() => setImagePreview("")}
              />
            </div>
          )}
        </div>

        {/* Room Title */}
        <InputField
          kind="text"
          name="title"
          label="Room Name"
          placeholder="e.g., BHAGIRATHI"
          value={formData.title || ""}
          onChange={(value) => handleInputChange("title", value)}
          required
          error={errors.title}
        />

        {/* Location */}
        <InputField
          kind="text"
          name="location"
          label="Location"
          placeholder="e.g., Pune Hinjewadi"
          value={formData.location || ""}
          onChange={(value) => handleInputChange("location", value)}
          required
          error={errors.location}
        />

        {/* Seats */}
        <InputField
          kind="number"
          name="seats"
          label="Number of Seats"
          placeholder="e.g., 10"
          value={formData.seats?.toString() || ""}
          onChange={(value) => handleInputChange("seats", parseInt(value) || 0)}
          min={1}
          required
          error={errors.seats}
        />

        {/* Availability Schedule */}
        <InputField
          kind="text"
          name="availablility"
          label="Availability Schedule"
          placeholder="e.g., 8:00am - 5:00pm, Mon - Fri"
          value={formData.availablility || ""}
          onChange={(value) => handleInputChange("availablility", value)}
          required
          error={errors.availablility}
        />

        {/* Amenities */}
        <InputField
          kind="badge"
          name="amenities"
          label="Amenities"
          placeholder="Select amenities"
          options={availableAmenities}
          value={formData.amenities || []}
          onChange={handleAmenitiesChange}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="hover:bg-[var(--bloom-blue)]/90 h-[41px] border-b-4 bg-[var(--bloom-blue)] px-6 text-white disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Save Room"}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-[41px] border border-gray-300 bg-white px-6 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
