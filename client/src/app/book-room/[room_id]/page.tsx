"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import AlertDialog from "@/components/alert-dialog";
import InputField from "@/components/input";
import ReCAPTCHAV2 from "@/components/recaptcha";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

function BookRoomForm() {
  const params = useParams();
  const room_id = Number(params.room_id);

  const [all_day, setAllDay] = useState(false);
  const [verified, setVerified] = useState(false);
  const [alertDialogProps, setAlertDialogProps] = useState({
    title: "",
    successText: "",
    showIcon: false,
    isPending: false,
  });

  /**
   * Combine a date object and a HH:MM time string to a ISO string
   * @param date a Date object
   * @param time a valid time in format HH:MM
   * @returns a Date object with the same date as date param and time contained in time string
   */
  function formatDateTime(date: Date, time: string) {
    const full_date = new Date(date);
    const time_split = time.split(":");
    const hours = Number(time_split[0]);
    const mins = Number(time_split[1]);
    full_date.setHours(hours);
    full_date.setMinutes(mins);
    const iso_string = full_date.toISOString();
    return iso_string;
  }

  const formSchema = z
    .object({
      name: z
        .string("This is a required field.")
        .min(1, "This is a required field."),
      email: z.email("Must be a valid email address."),
      title: z
        .string("This is a required field.")
        .min(1, "This is a required field."),
      description: z.string().optional(),
      date: z.date("Must be a valid date.").min(
        new Date().setDate(new Date().getDate() - 1), // Yesterday's date
        "Cannot be a date in the past.",
      ),
      start_time: z.iso.time("Must be a valid time."),
      end_time: z.iso.time("Must be a valid time."),
    })
    .refine(
      (data) => {
        const now = new Date();
        const start_datetime = new Date(
          Date.parse(formatDateTime(data.date, data.start_time)),
        );
        return now < start_datetime;
      },
      {
        message: "Start time must be in the future.",
        path: ["start_time"],
      },
    )
    .refine(
      (data) => {
        const start_datetime = new Date(
          Date.parse(formatDateTime(data.date, data.start_time)),
        );
        const end_datetime = new Date(
          Date.parse(formatDateTime(data.date, data.end_time)),
        );
        return start_datetime < end_datetime;
      },
      {
        message: "End time must be after start time.",
        path: ["end_time"],
      },
    );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  /**
   * Uses data from the from to send an POST request to /api/bookings/ endpoint
   * and sets alertDialogProps and isPending according to server response.
   * @param data The data from the form.
   */
  function onSubmit(data: z.infer<typeof formSchema>) {
    setAlertDialogProps({
      title: "Submitting booking...",
      successText: "",
      showIcon: false,
      isPending: true,
    });
    const payload = {
      room_id: room_id,
      visitor_name: data.name,
      visitor_email: data.email,
      start_datetime: formatDateTime(data.date, data.start_time),
      end_datetime: formatDateTime(data.date, data.end_time),
      recurrence_rule: "",
      /*
      The below fields are not used by the API (at this point) but are
      fields of the form so are included here for future use.
      */
      booking_title: data.title,
      booking_description: data.description,
    };
    const alert_dialog_props = {
      title: "",
      successText: "",
      showIcon: false,
      isPending: false,
    };
    api({ url: "bookings/", method: "post", data: payload })
      .then((response) => {
        const res = response.data;
        const date = new Date(Date.parse(res.start_datetime));
        // Substring (0,5) gives just the HH:MM part of the string
        const start_time = new Date(Date.parse(res.start_datetime))
          .toTimeString()
          .substring(0, 5);
        const end_time = new Date(Date.parse(res.end_datetime))
          .toTimeString()
          .substring(0, 5);
        enum MonthString {
          Jan,
          Feb,
          Mar,
          Apr,
          May,
          Jun,
          Jul,
          Aug,
          Sep,
          Oct,
          Nov,
          Dec,
        }
        const success_text = cn(
          `Your ${res.room.name} Booking for`,
          `${date.getDate()} ${MonthString[date.getMonth()]} ${date.getFullYear()}`,
          `from ${start_time} to ${end_time}`,
          `has been submitted.\n`,
          `You will receive an email confirmation shortly.`,
        );
        alert_dialog_props.title = "Awesome!";
        alert_dialog_props.successText = success_text;
        alert_dialog_props.showIcon = true;
      })
      .catch((error) => {
        alert_dialog_props.title = "Sorry!";
        alert_dialog_props.showIcon = false;
        const res = error.response.data;
        if (res.start_datetime !== undefined) {
          alert_dialog_props.successText = cn(res.start_datetime);
        } else if (res.end_datetime !== undefined) {
          alert_dialog_props.successText = cn(res.end_datetime);
        } else if (res.non_field_errors !== undefined) {
          alert_dialog_props.successText = cn(res.non_field_errors);
        } else if (res.detail !== undefined) {
          alert_dialog_props.successText = cn(res.detail);
        } else {
          alert_dialog_props.successText = "Unknown error.";
          console.error(error);
        }
      })
      .finally(() => {
        setAlertDialogProps(alert_dialog_props);
      });
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "h-fit w-full min-w-[32rem] max-w-[56rem] rounded-md",
        "flex flex-col gap-6 bg-white px-16 py-12",
      )}
    >
      <div className="flex flex-row gap-3">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="text"
                  required={true}
                  name="name"
                  label="Name"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="text"
                  required={true}
                  name="email"
                  label="Email"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-row">
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputField
                  kind="text"
                  required={true}
                  name="title"
                  label="Title of the booking"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        name="description"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <InputField
                kind="text"
                required={false}
                name="description"
                label="Description of the booking (Optional)"
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-row gap-3">
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <InputField
                  kind="date"
                  required={true}
                  name="date"
                  label="Date"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="start_time"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <InputField
                  kind="time-select"
                  required={true}
                  name="start_time"
                  label="Start time"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="end_time"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <InputField
                  kind="time-select"
                  required={true}
                  name="end_time"
                  label="End time"
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <Checkbox
        className="ml-6"
        checked={all_day}
        onCheckedChange={(checked) => setAllDay(checked === true)}
        disabled={true}
      >
        All Day (Currently not implemented)
      </Checkbox>
      <ReCAPTCHAV2 setVerified={setVerified} />
      <AlertDialog {...alertDialogProps}>
        <Button
          type="submit"
          className="w-1/6 min-w-[8rem] font-bold"
          disabled={!verified}
        >
          Submit
        </Button>
      </AlertDialog>
    </Form>
  );
}

export default function BookRoomPage() {
  const params = useParams();
  const room_id = Number(params.room_id);

  // Temporary fix to ensure room is always a room type
  const loading_room: Room = {
    id: -1,
    title: "Loading...",
    image:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAFgwJ/lYpukQAAAABJRU5ErkJggg==",
    location: "",
    available: false,
    availablility: "",
    seats: 0,
    amenities: [],
    bookings: 0,
    removed: false,
  };

  const [room, setRoom] = useState(loading_room);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches the room information for the room with the specified id.
   * @param {Number} room_id Id of the room to fetch infomation about.
   */
  async function fetchRoom(room_id: number) {
    const defaultImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAFgwJ/lYpukQAAAABJRU5ErkJggg==";
    const apiUrl = `rooms/${room_id}/`;
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        const data = response.data;
        const room: Room = {
          id: data.id,
          title: data.name,
          image: data.img !== null ? data.img : defaultImage,
          seats: data.capacity,
          location: data.location.name,
          available: data.is_active,
          /*
          Unsure how to form the availability string from the 
          start_datetime and end_datetime under the rooms api.
          */
          availablility: "TODO",
          amenities: data.amenities.map(
            (amenity: { id: number; name: string }) => amenity.name,
          ),
          /*
                    Number of bookings for a specific room is not readily 
                    accessible through the api for non-admin users as the 
                    endpoint `bookings/?room_id={id}` is Admin only.

                    Only the count of bookings would be required for this prop.
                    */
          bookings: -1,
        };
        setRoom(room);
      })
      .catch((error) => {
        // TODO: handle error (properly)
        console.error("Error fetching room:", error);
        setError(error.message);

        const err_room: Room = {
          id: -1,
          title: "Error... unable to load room",
          image: defaultImage,
          location: "",
          available: false,
          availablility: "",
          seats: 0,
          amenities: [],
          bookings: 0,
          removed: false,
        };
        setRoom(err_room);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    fetchRoom(room_id);
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-100">
      <div className="flex w-full items-center px-[3rem] py-[2rem]">
        <h1 className="text-xl font-semibold">Book room</h1>
      </div>
      <div className="flex h-full w-full items-start justify-center gap-[3rem] p-[1rem]">
        <div className="w-fit max-w-[24rem]">
          <RoomCard room={room} />
        </div>
        <BookRoomForm />
      </div>
    </div>
  );
}
