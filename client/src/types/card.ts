export type Room = {
  id: number;
  name: string;
  img: string;
  location: string;
  is_active: boolean;
  capacity: number;
  amenities: string[];
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
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
  },
  {
    id: 2,
    name: "GHATAPRABHA",
    img: defaultImage,
    capacity: 8,
    location: "St Catherine's college, 2 Park Road",
    is_active: false,
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
  },
  {
    id: 3,
    name: "BHIMA",
    img: defaultImage,
    capacity: 8,
    location: "UNIT-1B PNQ- HJ",
    is_active: true,
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
  },
  {
    id: 4,
    name: "TUNGBHADRA",
    img: defaultImage,
    capacity: 4,
    location: "St Catherine's college, 2 Park Road",
    is_active: true,
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
  },
  {
    id: 5,
    name: "BRAMHAPUTRA",
    img: defaultImage,
    capacity: 4,
    location: "UNIT-1B PNQ- HJ",
    is_active: false,
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
  },
  {
    id: 6,
    name: "SINDU",
    img: defaultImage,
    capacity: 4,
    location: "Pune Hinjewadi",
    is_active: true,
    amenities: ["Audio", "Video", "HDMI", "White Board", "Sound System"],
  },
];
