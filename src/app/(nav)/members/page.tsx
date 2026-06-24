import type { Metadata } from "next";
import { MembersView } from "@/components/nav/MembersView";

export const metadata: Metadata = { title: "Members" };

export default function Page() {
  return <MembersView />;
}
