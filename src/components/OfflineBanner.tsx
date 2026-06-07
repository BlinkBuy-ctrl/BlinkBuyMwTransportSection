import { WifiOff, Wifi } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const { isOffline, wasOffline } = useOffline();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOffline && wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className={`fixed top-14 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-bold text-white transition-all ${
      isOffline ? "bg-red-600" : "bg-green-600"
    }`}>
      {isOffline ? (
        <><WifiOff size={13}/> No internet — showing cached data</>
      ) : (
        <><Wifi size={13}/> Back online ✓</>
      )}
    </div>
  );
}
