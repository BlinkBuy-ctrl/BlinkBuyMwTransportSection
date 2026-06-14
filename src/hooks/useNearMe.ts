import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Approximate coordinates for Malawi cities
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Lilongwe":    { lat: -13.9626, lng: 33.7741 },
  "Blantyre":    { lat: -15.7861, lng: 35.0058 },
  "Mzuzu":       { lat: -11.4656, lng: 34.0207 },
  "Zomba":       { lat: -15.3833, lng: 35.3167 },
  "Mangochi":    { lat: -14.4833, lng: 35.2667 },
  "Salima":      { lat: -13.7833, lng: 34.4500 },
  "Karonga":     { lat: -9.9333,  lng: 33.9333 },
  "Kasungu":     { lat: -13.0333, lng: 33.4833 },
  "Dedza":       { lat: -14.3667, lng: 34.3333 },
  "Nkhata Bay":  { lat: -11.6000, lng: 34.2833 },
  "Mulanje":     { lat: -16.0333, lng: 35.5000 },
  "Thyolo":      { lat: -16.0667, lng: 35.1333 },
  "Balaka":      { lat: -14.9833, lng: 34.9667 },
  "Mchinji":     { lat: -13.8000, lng: 32.8833 },
  "Nsanje":      { lat: -16.9167, lng: 35.2667 },
  "Nkhotakota":  { lat: -12.9167, lng: 34.3000 },
  "Rumphi":      { lat: -11.0167, lng: 33.8667 },
  "Dowa":        { lat: -13.6500, lng: 33.9333 },
  "Ntcheu":      { lat: -14.8167, lng: 34.6333 },
  "Chiradzulu":  { lat: -15.6667, lng: 35.1833 },
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine formula — returns distance in km between two coords
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Match a listing's location string to known city coords
function resolveCoords(locationStr: string): { lat: number; lng: number } | null {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city.toLowerCase())) return coords;
  }
  return null;
}

export interface NearMeListing {
  id: string;
  title: string;
  vehicle_type: string;
  location: string;
  rating: number;
  review_count: number;
  price_display: string | null;
  price: number | null;
  is_online: boolean;
  tags: string[];
  whatsapp?: string;
  phone?: string;
  distanceKm: number | null;
}

export type PermissionState = "idle" | "requesting" | "granted" | "denied";

export function useNearMe() {
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [listings, setListings]     = useState<NearMeListing[]>([]);
  const [loading, setLoading]       = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch listings sorted by distance from user coords
  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, vehicle_type, location, rating, review_count, price_display, price, is_online, tags, whatsapp, phone")
        .eq("status", "active")
        .limit(50); // fetch more so we can sort by distance client-side

      if (!error && data) {
        const withDistance = (data as NearMeListing[])
          .map(item => {
            const coords = resolveCoords(item.location);
            const distanceKm = coords
              ? Math.round(haversineKm(lat, lng, coords.lat, coords.lng))
              : null;
            return { ...item, distanceKm };
          })
          .sort((a, b) => {
            // Items with known distance come first, sorted ascending
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
          })
          .slice(0, 12);

        setListings(withDistance);
        setIsFallback(false);
      }
    } catch {
      // silent fail — fallback handles it
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trending/top-rated as fallback when GPS is denied
  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, vehicle_type, location, rating, review_count, price_display, price, is_online, tags, whatsapp, phone")
        .eq("status", "active")
        .order("rating", { ascending: false })
        .limit(12);

      if (!error && data) {
        setListings(
          (data as NearMeListing[]).map(item => ({ ...item, distanceKm: null }))
        );
        setIsFallback(true);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Browser doesn't support geolocation — go straight to fallback
      setPermission("denied");
      fetchTrending();
      return;
    }

    setPermission("requesting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setPermission("granted");
        fetchNearby(coords.lat, coords.lng);
      },
      (_err) => {
        setPermission("denied");
        fetchTrending();
      },
      { timeout: 10000, maximumAge: 300000 } // 5 min cache on position
    );
  }, [fetchNearby, fetchTrending]);

  // Auto-request on mount
  useEffect(() => {
    // Check if permission was already granted in a previous session
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocation();
        }
        // If "prompt" or "denied" — wait for user to tap the button
      }).catch(() => {
        // permissions API not supported — show prompt UI
      });
    }
  }, [requestLocation]);

  return {
    permission,
    listings,
    loading,
    isFallback,
    userCoords,
    requestLocation,
    refetch: userCoords
      ? () => fetchNearby(userCoords.lat, userCoords.lng)
      : fetchTrending,
  };
}
