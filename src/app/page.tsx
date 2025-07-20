import WebcamCanvas from "@/components/FaceDetect";
export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Face Detection</h1>
      <WebcamCanvas />
    </main>
  );
}
