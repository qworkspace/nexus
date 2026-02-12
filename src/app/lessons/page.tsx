import { LessonsDashboard } from "@/components/LessonsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lessons | Nexus",
  description: "Q Lessons Tracker - Mistake prevention dashboard",
};

export default function LessonsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <LessonsDashboard />
    </div>
  );
}
