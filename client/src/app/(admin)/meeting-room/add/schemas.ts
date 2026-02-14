import { z } from "zod";

export const AmenityFormSchema = z.object({
  name: z.string().min(1, "Amenity name is required").trim(),
});

export type AmenityFormInput = z.infer<typeof AmenityFormSchema>;

export const LocationFormSchema = z.object({
  name: z.string().min(1, "Location name is required").trim(),
});

export type LocationFormInput = z.infer<typeof LocationFormSchema>;

export const CustomRepeatSchema = z.object({
  interval: z.string().min(1, "Interval is required"),
  frequency: z.enum(["day", "week", "month"]),
  days: z.array(z.string()).default([]),
  endType: z.enum(["on", "after", "never"]),
  endDate: z.date().optional(),
  occurrences: z.string(),
  startDate: z.date().optional(),
});

export type CustomRepeatValue = z.infer<typeof CustomRepeatSchema>;

export const AddMeetingRoomSchema = z
  .object({
    title: z.string().min(1, "Room name is required").trim(),
    location: z
      .string()
      .or(z.number())
      .refine((val) => {
        const locationId = typeof val === "string" ? parseInt(val, 10) : val;
        return !isNaN(locationId) && locationId > 0;
      }, "Location is required"),
    seats: z
      .number()
      .or(z.string())
      .refine((val) => {
        const numVal = typeof val === "string" ? parseInt(val, 10) : val;
        return !isNaN(numVal) && numVal > 0;
      }, "Capacity must be greater than 0"),
    start_datetime: z
      .string()
      .min(1, "Start date/time is required")
      .refine((val) => !isNaN(new Date(val).getTime()), "Invalid start date"),
    end_datetime: z
      .string()
      .min(1, "End date/time is required")
      .refine((val) => !isNaN(new Date(val).getTime()), "Invalid end date"),
    amenities: z.array(z.string().or(z.number())).default([]),
    image: z.string().optional(),
    recurrence_rule: z.string().optional(),
  })
  .refine(
    (data) => {
      const startTime = new Date(data.start_datetime).getTime();
      const endTime = new Date(data.end_datetime).getTime();
      return endTime > startTime;
    },
    {
      message: "End time must be after start time",
      path: ["end_datetime"],
    },
  );

export type AddMeetingRoomInput = z.infer<typeof AddMeetingRoomSchema>;
export type AddMeetingRoomFormInput = z.input<typeof AddMeetingRoomSchema>;
