import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  storage_path: string;
  position: number;
  mime_type: string;
  size_bytes?: number;
}

const BUCKET = "listing-images";
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Fetch images for a listing ────────────────────────────────────────────────
export async function fetchListingImages(listingId: string): Promise<ListingImage[]> {
  const { data, error } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", listingId)
    .order("position", { ascending: true });
  if (error) { console.warn("[fetchListingImages]", error.message); return []; }
  return (data ?? []) as ListingImage[];
}

// ── Upload one image ──────────────────────────────────────────────────────────
export async function uploadListingImage(
  listingId: string,
  operatorToken: string,
  file: File,
  position: 0 | 1
): Promise<ListingImage> {
  if (!ALLOWED.includes(file.type))
    throw new Error("Only JPEG, PNG or WebP images are allowed.");
  if (file.size > MAX_BYTES)
    throw new Error("Image must be under 5 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${listingId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { data, error: dbErr } = await supabase
    .from("listing_images")
    .insert({
      listing_id: listingId,
      operator_token: operatorToken,
      storage_path: storagePath,
      url: urlData.publicUrl,
      position,
      size_bytes: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (dbErr) {
    // Clean up orphaned file
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`DB error: ${dbErr.message}`);
  }

  return data as ListingImage;
}

// ── Delete one image ──────────────────────────────────────────────────────────
export async function deleteListingImage(image: ListingImage): Promise<void> {
  await supabase.storage.from(BUCKET).remove([image.storage_path]);
  const { error } = await supabase.from("listing_images").delete().eq("id", image.id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ── Hook for upload/delete state management ───────────────────────────────────
export function useListingImages(listingId: string | null, operatorToken: string) {
  const [images, setImages]     = useState<ListingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    if (!listingId) { setError("Save listing first before uploading images."); return; }
    if (images.length >= 2) { setError("Maximum 2 images allowed."); return; }
    setUploading(true); setError(null);
    try {
      const img = await uploadListingImage(listingId, operatorToken, file, images.length as 0 | 1);
      setImages(prev => [...prev, img]);
    } catch (e: any) {
      setError(e.message ?? "Upload failed.");
    } finally { setUploading(false); }
  }, [listingId, operatorToken, images.length]);

  const remove = useCallback(async (image: ListingImage) => {
    setError(null);
    try {
      await deleteListingImage(image);
      setImages(prev => prev.filter(i => i.id !== image.id));
    } catch (e: any) {
      setError(e.message ?? "Delete failed.");
    }
  }, []);

  return { images, setImages, uploading, error, upload, remove };
}
