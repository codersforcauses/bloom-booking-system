import { AdminCard, MobileCard, UserCard } from "@/components/ui/room-card";
import { roomsMock } from "@/types/card";

export default function RoomsList() {
  return (
    <div className="w-full rounded-xl bg-gray-100 p-6">
      <h2 className="mb-4 text-xl font-semibold">User Meeting Rooms Display</h2>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
        {roomsMock.map((room) => (
          <UserCard key={room.id} room={room} />
        ))}
      </div>

      <div className="my-10 border-t border-gray-300"></div>

      <h2 className="mb-4 text-xl font-semibold">
        Admin Meeting Rooms Display
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {roomsMock.map((room) => (
          <AdminCard key={room.id} room={room} />
        ))}
      </div>
      <div className="my-10 border-t border-gray-300"></div>

      <h2 className="mb-4 text-xl font-semibold">
        Meeting Rooms Display (Mobile)
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {roomsMock.map((room) => (
          <MobileCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
