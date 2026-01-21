"use client";

import { useParams } from "next/navigation";
import { useEffect,useState } from "react";

import AlertDialog from "@/components/alert-dialog";
import InputField from "@/components/input";
import ReCAPTCHAV2 from "@/components/recaptcha";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

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

  // Form properties
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(undefined);
  const [start_time, setStartTime] = useState("");
  const [end_time, setEndTime] = useState("");
  const [all_day, setAllDay] = useState(false);
  const [verified, setVerified] = useState(false);

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
        // TODO: handle error
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

  /**
   *
   */
  async function submitBooking() {
    // FIX THIS
    if (date == undefined) return;

    // Probably a better way to do this
    function formatDateTime(date: Date, time: string) {
      return (
        String(date.getFullYear()) +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()) +
        "T" +
        time.padStart(5, "0") +
        ":00Z"
      );
    }

    const data = {
      room_id: room_id,
      visitor_name: name,
      visitor_email: email,
      start_datetime: formatDateTime(date, start_time),
      end_datetime: formatDateTime(date, end_time),
      recurrence_rule: "",
      /* The two fields below are not used by the API but are form 
            elements so are included for probable future use. */
      booking_title: title,
      booking_description: description,
    };
    const json = JSON.parse(JSON.stringify(data));
    const params = new URLSearchParams(json);

    const apiUrl = `bookings/`;
    api({ url: apiUrl, method: "post", data: data })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  useEffect(() => {
    fetchRoom(room_id);
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-100">
      <div className="h-[7rem] w-full bg-white">{/* Placeholder navbar */}</div>
      <div className="flex w-full items-center px-[3rem] py-[2rem]">
        <h1 className="text-lg font-semibold">Book room</h1>
      </div>
      <div className="flex h-full w-full items-start justify-center gap-[3rem] p-[1rem]">
        <div className="w-fit max-w-[24rem]">
          <RoomCard room={room} />
        </div>
        <form
          className={cn(
            "h-fit w-full min-w-[32rem] max-w-[56rem] rounded-md",
            "flex flex-col gap-6 bg-white px-16 py-12",
          )}
        >
          <div className="flex flex-row gap-3">
            <InputField
              className="w-1/3"
              kind="text"
              required={true}
              name="name"
              label="Name"
              value={name}
              onChange={setName}
            />
            <InputField
              className="w-1/3"
              kind="text"
              required={true}
              name="email"
              label="Email"
              value={email}
              onChange={setEmail}
            />
          </div>
          <div className="flex flex-row">
            <InputField
              className="w-1/3"
              kind="text"
              required={true}
              name="title"
              label="Title of the booking"
              value={title}
              onChange={setTitle}
            />
          </div>
          <InputField
            className="w-full"
            kind="text"
            required={false}
            name="description"
            label="Description of the booking (Optional)"
            value={description}
            onChange={setDescription}
          />
          <div className="flex flex-row gap-3">
            <InputField
              className="w-full"
              kind="date"
              required={true}
              name="date"
              label="Date"
              value={date}
              onChange={setDate}
            />
            <InputField
              className="w-full"
              kind="time-select"
              required={true}
              name="start_time"
              label="Start time"
              value={start_time}
              onChange={setStartTime}
            />
            <InputField
              className="w-full"
              kind="time-select"
              required={true}
              name="end_time"
              label="End time"
              value={end_time}
              onChange={setEndTime}
            />
          </div>
          <Checkbox
            className="ml-6"
            checked={all_day}
            onCheckedChange={(checked) => setAllDay(checked === true)}
          >
            All Day
          </Checkbox>
          <div className="h-8">{/* This is a divider */}</div>
          <ReCAPTCHAV2 setVerified={setVerified} />
          <AlertDialog title="" successText="" showIcon={true}>
            <Button
              className="w-1/6 min-w-[8rem] font-bold"
              onClick={submitBooking}
            >
              Submit
            </Button>
          </AlertDialog>
        </form>
      </div>
    </div>
  );
}
