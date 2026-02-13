"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  AlertDialog,
  AlertDialogProps,
  AlertDialogVariant,
} from "@/components/alert-dialog";
import InputField, { SelectOption } from "@/components/input";
import ReCAPTCHAV2 from "@/components/recaptcha";
import { PLACEHOLDER_IMAGE, RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useFetchBooking, useUpdateBooking } from "@/hooks/booking";
import RoomAPI from "@/hooks/room";
import api from "@/lib/api";
import { normaliseRoom } from "@/lib/normalise-room";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

import { formatDateTime } from "../../book-room/[room_id]/room-utils";

const formSchema = z.object({
  name: z.string().min(1, "This is a required field."),
  email: z.email("Must be a valid email address."),
  date: z.date(),
  start_time: z.string(),
  end_time: z.string(),
});

function EditBookingForm({ booking }: { booking: any }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  const [alertDialogProps, setAlertDialogProps] = useState<AlertDialogProps>({
    title: "",
    description: "",
    variant: "info",
    open: false,
    onConfirm: (): void => {
      setAlertDialogProps((prev: AlertDialogProps) => ({
        ...prev,
        open: false,
      }));
    },
    onClose: (): void => {
      setAlertDialogProps((prev: AlertDialogProps) => ({
        ...prev,
        open: false,
      }));
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: booking?.visitor_name || "",
      email: booking?.visitor_email || "",
      date: booking?.start_datetime
        ? new Date(booking.start_datetime)
        : undefined,
      start_time: booking?.start_datetime
        ? new Date(booking.start_datetime).toTimeString().substring(0, 5)
        : "",
      end_time: booking?.end_datetime
        ? new Date(booking.end_datetime).toTimeString().substring(0, 5)
        : "",
    },
  });

  const mutation = useUpdateBooking(booking.id);
  function onSubmit(data: z.infer<typeof formSchema>) {
    const start_datetime = formatDateTime(data.date, data.start_time);
    const end_datetime = formatDateTime(data.date, data.end_time);
    const payload = {
      room_id: booking.room.id,
      visitor_name: data.name,
      visitor_email: data.email,
      start_datetime,
      end_datetime,
      recurrence_rule: "",
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        setAlertDialogProps({
          title: "Booking updated!",
          description: "Your booking has been updated.",
          variant: "success",
          open: true,
          onConfirm: () => router.push("/"),
          onClose: () => router.push("/"),
        });
      },
      onError: () => {
        setAlertDialogProps({
          title: "Error",
          description: "Failed to update booking.",
          variant: "error",
          open: true,
          onConfirm: () =>
            setAlertDialogProps((prev) => ({ ...prev, open: false })),
          onClose: () =>
            setAlertDialogProps((prev) => ({ ...prev, open: false })),
        });
      },
    });
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "h-fit w-full rounded-md md:min-w-[32rem] md:max-w-[56rem]",
        "flex flex-col gap-6 bg-white px-8 py-8 md:px-16 md:py-12",
      )}
    >
      <div>
        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="font-bold">Name *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    required
                    name="name"
                    value={field.value || ""}
                    onChange={field.onChange}
                    disabled={true}
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
              <FormItem className="w-full">
                <FormLabel className="font-bold">Email *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    required
                    name="email"
                    value={field.value || ""}
                    onChange={field.onChange}
                    disabled={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <FormField
            name="date"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <InputField
                    kind="date"
                    required
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
                    kind="text"
                    required
                    name="start_time"
                    label="Start time"
                    value={field.value || ""}
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
                    kind="text"
                    required
                    name="end_time"
                    label="End time"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      <ReCAPTCHAV2 setVerified={setVerified} />
      <Button
        type="submit"
        className="w-fit px-6"
        disabled={!verified || mutation.isPending}
      >
        {!mutation.isPending ? "Submit" : <Spinner className="w-6" />}
      </Button>
      <AlertDialog {...alertDialogProps} />
    </Form>
  );
}

type DetailPageProps = {
  isAdminPage?: boolean;
};

export default function EditBookingPage({
  isAdminPage = false,
}: DetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = Number(params.booking_id);
  const visitorEmail = searchParams.get("visitor_email");
  const {
    data: booking,
    isLoading: isLoadingBooking,
    isError: isErrorBooking,
  } = useFetchBooking(
    bookingId,
    isAdminPage ?? false,
    visitorEmail ?? undefined,
  );

  const {
    data: room,
    isLoading: isLoadingRoom,
    isError: isErrorRoom,
  } = RoomAPI.useFetchRoom(booking?.room.id ?? -1);

  const normalisedRoom = useMemo(() => {
    if (!room) return null;
    return normaliseRoom(room);
  }, [room]);
  const loading_room: Room = {
    id: -1,
    title: "Loading...",
    image: PLACEHOLDER_IMAGE,
    location: "",
    available: false,
    availability: "",
    seats: 0,
    amenities: [],
    removed: false,
  };

  if (isLoadingBooking || isLoadingRoom) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="w-6" />
      </div>
    );
  }

  if (isErrorBooking || isErrorRoom) {
    return (
      <AlertDialog
        title="An error has occurred"
        description="Unable to load booking information. Please try again later."
        variant="error"
        open={true}
        onConfirm={() => router.push("/")}
        onClose={() => router.push("/")}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center px-[1rem] pt-[1rem] md:px-[3rem]">
        <h1 className="text-xl font-semibold">Edit booking</h1>
      </div>
      <div
        className={cn(
          "flex h-full w-full flex-col lg:flex-row",
          "items-center justify-center gap-4 p-4 md:px-12 lg:items-start xl:gap-12",
        )}
      >
        <div className="w-96">
          <RoomCard room={normalisedRoom || loading_room} />
        </div>
        <EditBookingForm booking={booking} />
      </div>
    </div>
  );
}
