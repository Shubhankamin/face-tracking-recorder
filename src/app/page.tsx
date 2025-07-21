// /app/page.tsx
"use client";

import dynamic from "next/dynamic";

const FaceDetection = dynamic(() => import("@/components/FaceDetect"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-100">
      <FaceDetection />
    </main>
  );
}
