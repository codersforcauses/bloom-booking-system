"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";

import BookRoomForm from "@/app/book-room/[room_id]/booking-form";
import NotFound from "@/app/not-found";
import { AlertDialog } from "@/components/alert-dialog";
import { RoomCard } from "@/components/room-card";
import RoomAPI from "@/hooks/room";
import { normaliseRoom } from "@/lib/normalise-room";
import { cn, resolveErrorMessage } from "@/lib/utils";

export default function BookRoomPage() {
  const router = useRouter();

  const params = useParams();
  const room_id = Number(params.room_id);
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const start_time = searchParams.get("start_time");
  const end_time = searchParams.get("end_time");
  const name = searchParams.get("name");
  const email = searchParams.get("email");

  if (room_id === undefined || isNaN(room_id)) {
    return <NotFound />;
  }

  const {
    data: roomData,
    isLoading,
    isError,
    error,
  } = RoomAPI.useFetchRoom(room_id);

  const room = normaliseRoom(roomData);

  if (isError) {
    return (
      <AlertDialog
        title="An error has occurred"
        description={
          resolveErrorMessage(error) ||
          "Unable to load room information. Please try again later."
        }
        variant="error"
        open={true}
        onConfirm={() => {
          router.push("/");
        }}
        onClose={() => {
          router.push("/");
        }}
      />
    );
  }

  return (
    <div className="h-fit w-full">
      <div className="flex w-full items-center px-4 pt-4 md:px-12">
        <h1 className="text-xl font-semibold">Book room</h1>
      </div>
      <div
        className={cn(
          "flex h-full w-full flex-col lg:flex-row",
          "items-center justify-center gap-4 p-4 md:px-12 lg:items-start xl:gap-12",
        )}
      >
        <div className="w-96">
          <RoomCard room={room} />
        </div>
        <BookRoomForm
          room_id={room_id}
          date={date ?? undefined}
          start_time={start_time ?? undefined}
          end_time={end_time ?? undefined}
          name={name ?? undefined}
          email={email ?? undefined}
          isCalendar={false}
        />
      </div>
    </div>
  );
}
