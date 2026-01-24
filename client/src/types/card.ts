export type Room = {
  id: number;
  name: string;
  img: string;
  location: string;
<<<<<<< HEAD
  available: boolean;
  availablility?: string;
  seats: number;
  amenities: string[];
  bookings?: number;
  removed?: boolean;
=======
  is_active: boolean;
  // availablility: string;
  capacity: number;
  amenities: string[];
  // bookings: number;
  // removed?: boolean;
>>>>>>> b2398fe (Fix room type to match api response)
};

const defaultImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAFgwJ/lYpukQAAAABJRU5ErkJggg==";

export const roomsMock: Room[] = [
  {
    id: 1,
    name: "BHAGIRATHI",
    img: defaultImage,
    capacity: 4,
    location: "Pune Hinjewadi",
    is_active: true,
    // availablility: "8:00am - 5:00pm, Mon - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    // bookings: 10,
    // removed: true,
  },
  {
    id: 2,
    name: "GHATAPRABHA",
    img: defaultImage,
    capacity: 8,
    location: "St Catherine's college, 2 Park Road",
    is_active: false,
    // availablility: "8:00am - 7:00pm, Mon - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    // bookings: 5,
  },
  {
    id: 3,
    name: "BHIMA",
    img: defaultImage,
    capacity: 8,
    location: "UNIT-1B PNQ- HJ",
    is_active: true,
    // availablility: "9:00am - 5:00pm, Mon - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    // bookings: 3,
  },
  {
    id: 4,
    name: "TUNGBHADRA",
    img: defaultImage,
    capacity: 4,
    location: "St Catherine's college, 2 Park Road",
    is_active: true,
    // availablility: "12;00pm - 7:00pm, Wed - Fri",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    // bookings: 8,
    // removed: true,
  },
  {
    id: 5,
    name: "BRAMHAPUTRA",
    img: defaultImage,
    capacity: 4,
    location: "UNIT-1B PNQ- HJ",
    is_active: false,
    // availablility: "10:00am - 4:00pm, Mon - Tues",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    // bookings: 7,
  },
  {
    id: 6,
    name: "SINDU",
    img: defaultImage,
    capacity: 4,
    location: "Pune Hinjewadi",
    is_active: true,
    // availablility: "9:00am - 3:00pm, Mon - Thurs",
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
    // bookings: 5,
  },
];
