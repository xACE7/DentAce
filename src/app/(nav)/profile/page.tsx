import type { Metadata } from "next";
import { ProfileView } from "@/components/nav/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return <ProfileView />;
}
