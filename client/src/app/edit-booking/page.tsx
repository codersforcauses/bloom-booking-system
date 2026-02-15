import { redirect } from "next/navigation";

export default function EditBookingRedirect() {
  redirect("/find-my-booking");
  return null;
}
