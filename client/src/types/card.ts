export type Room = {
  id: number;
  title: string;
  image: string;
  location: string;
  available: boolean;
  availability?: string;
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
    location: "Pune Hinjewadi",
    available: true,
    availability: "8:00am - 5:00pm, Mon - Fri",
    bookings: 10,
    removed: true,
  },
  {
    id: 2,
    title: "GHATAPRABHA",
    image: defaultImage,
    location: "St Catherine's college, 2 Park Road",
    available: false,
    availability: "8:00am - 7:00pm, Mon - Fri",
    bookings: 5,
  },
  {
    id: 3,
    title: "BHIMA",
    image: defaultImage,
    location: "UNIT-1B PNQ- HJ",
    available: true,
    availability: "9:00am - 5:00pm, Mon - Fri",
    bookings: 3,
  },
  {
    id: 4,
    title: "TUNGBHADRA",
    image: defaultImage,
    location: "St Catherine's college, 2 Park Road",
    available: true,
    availability: "12:00pm - 7:00pm, Wed - Fri",
    bookings: 8,
    removed: true,
  },
  {
    id: 5,
    title: "BRAMHAPUTRA",
    image: defaultImage,
    location: "UNIT-1B PNQ- HJ",
    available: false,
    availability: "10:00am - 4:00pm, Mon - Tues",
    bookings: 7,
  },
  {
    id: 6,
    title: "SINDU",
    image: defaultImage,
    location: "Pune Hinjewadi",
    available: true,
    availability: "9:00am - 3:00pm, Mon - Thurs",
    bookings: 5,
  },
];
