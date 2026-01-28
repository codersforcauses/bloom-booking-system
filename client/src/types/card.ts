export type Room = {
  id: number;
  title: string;
  image: string;
  location: string;
  available: boolean;
  availability?: string;
  seats: number;
  amenities: string[];
  bookings?: number;
  removed?: boolean;
  start_datetime?: string;
  end_datetime?: string;
  recurrence_rule?: string;
  isActive?: boolean;
};

const defaultImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAFgwJ/lYpukQAAAABJRU5ErkJggg==";

export const roomsMock: Room[] = [
  {
    id: 1,
    title: "BHAGIRATHI",
    image: defaultImage,
    seats: 4,
    location: "Pune Hinjewadi",
    available: true,
    availability: "8:00am - 5:00pm, Mon - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 10,
    removed: true,
  },
  {
    id: 2,
    title: "GHATAPRABHA",
    image: defaultImage,
    seats: 8,
    location: "St Catherine's college, 2 Park Road",
    available: false,
    availability: "8:00am - 7:00pm, Mon - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 5,
  },
  {
    id: 3,
    title: "BHIMA",
    image: defaultImage,
    seats: 8,
    location: "UNIT-1B PNQ- HJ",
    available: true,
    availability: "9:00am - 5:00pm, Mon - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 3,
  },
  {
    id: 4,
    title: "TUNGBHADRA",
    image: defaultImage,
    seats: 4,
    location: "St Catherine's college, 2 Park Road",
    available: true,
    availability: "12:00pm - 7:00pm, Wed - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 8,
    removed: true,
  },
  {
    id: 5,
    title: "BRAMHAPUTRA",
    image: defaultImage,
    seats: 4,
    location: "UNIT-1B PNQ- HJ",
    available: false,
    availability: "10:00am - 4:00pm, Mon - Tues",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 7,
  },
  {
    id: 6,
    title: "SINDU",
    image: defaultImage,
    seats: 4,
    location: "Pune Hinjewadi",
    available: true,
    availability: "9:00am - 3:00pm, Mon - Thurs",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 5,
  },
];
