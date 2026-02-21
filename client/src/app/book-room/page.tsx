import { redirect } from "next/navigation";

export default function BookRoomRedirect() {
  redirect("/");
  return null;
}
