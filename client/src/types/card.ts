export type Room = {
  id: number;
  title: string;
  image: string;
  location: string;
  available: boolean;
  seats: number;
  amenities: string[];
  bookings: number;
  removed?: boolean;
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
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    bookings: 5,
  },
];
