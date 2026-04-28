import { useWastra } from "../context/WastraContext";
import DetectIntro from "../components/fragments/DetectionIntro";
import { Suspense, lazy } from "react";

const DetectionPage = lazy(() => import("./DetectionPage"));

export default function DetectionWrapper() {
  const { user, loading } = useWastra();

  if (!user && !loading) {
    return (
      <div className="animate-in fade-in duration-700">
        <DetectIntro />
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-in fade-in duration-700">
      <Suspense fallback={null}>
        <DetectionPage />
      </Suspense>
    </div>
  );
}