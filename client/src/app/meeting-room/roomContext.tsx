import { createContext, useContext } from "react";

type RoomContextType = {
  roomNames: string[];
};

const RoomContext = createContext<RoomContextType>({ roomNames: [] });

// Custom hook to access context
export const useRoomContext = () => useContext(RoomContext);

export default RoomContext;
