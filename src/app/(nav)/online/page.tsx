import type { Metadata } from "next";
import { OnlineView } from "@/components/nav/OnlineView";

export const metadata: Metadata = { title: "Who's online" };

export default function Page() {
  return <OnlineView />;
}
