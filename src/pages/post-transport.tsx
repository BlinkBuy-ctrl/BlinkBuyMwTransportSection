import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  MapPin, Banknote, Tag, Zap, ChevronDown,
  CheckCircle, Shield, Camera, X, ImagePlus, Loader2
} from "lucide-react";
import { supabaseConfigured, authedClient } from "@/lib/supabase";
import { getOrCreateIdentity } from "@/lib/identity";
import { uploadListingImage, deleteListingImage } from "@/hooks/useListingImages";
import type { ListingImage } from "@/hooks/useListingImages";

const VEHICLE_TYPES = [
  "Taxi","Motorcycle","Minibus","Shuttle","Hire Car",
  "Airport Transfer","Cargo / Delivery","School Transport",
  "Corporate Transport","Other"
];
const CITIES = [
  "Balaka","Blantyre","Chikwawa","Chiradzulu","Chitipa","Dedza","Dowa",
  "Karonga","Kasungu","Likoma","Lilongwe","Machinga","Mangochi","Mchinji",
  "Mulanje","Mwanza","Mzimba","Neno","Nkhata Bay","Nkhotakota","Nsanje",
  "Ntcheu","Ntchisi","Phalombe","Rumphi","Salima","Thyolo","Zomba"
];
const PRICE_TYPES = ["fixed","hourly","daily","per km","negotiable"];
const FEATURE_TAGS = [
  "AC","Air-Con","Airport Runs","Long Distance","City Only",
  "Night Trips","Corporate","Students","Families","Cargo",
  "Wheelchair Access","WiFi","Negotiable Price"
];
const STEPS = ["Vehicle","Route & Price","Availability","Review"];
const VEHICLE_ICONS: Record<string,string> = {
  "Taxi":"🚕","Motorcycle":"🏍️","Minibus":"🚌","Shuttle":"🚐",
  "Hire Car":"🚗","Airport Transfer":"✈️","Cargo / Delivery":"🚛",
  "School Transport":"🏫","Corporate Transport":"🏢","Other":"🚘"
};

export default function PostTransportPage() {
  const [, setLocation] = useLocation();
  const [step, setStep]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [listingId, setListingId] = useState<string|null>(null);
  const [operatorToken, setToken] = useState("");
  const [identityReady, setReady] = useState(false);

  // Image state
  const [images, setImages]         = useState<ListingImage[]>([]);
  const [imgUploading, setImgUp]    = useState(false);
  const [imgError, setImgErr]       = useState("");
  const fileRef                     = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title:"", vehicleType:"Taxi", description:"",
    fromCity:"Lilongwe", toCity:"Blantyre", coverOtherRoutes:false,
    location:"Lilongwe", priceType:"fixed", price:"", priceDisplay:"",
    whatsapp:"", phone:"", isOnline:true, tags:[] as string[],
  });

  useEffect(() => {
    getOrCreateIdentity().then(id => { setToken(id.token); setReady(true); });
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (t: string) => setForm(f => ({
    ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t]
  }));
  const canNext = () => {
    if (step === 0) return form.vehicleType && form.title.trim().length >= 5;
    if (step === 1) return !!form.fromCity;
    return true;
  };

  const submit = async () => {
    setLoading(true); setError("");
    try {
      if (!supabaseConfigured) throw new Error(
        "App not connected to database. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY then redeploy."
      );
      const identity = await getOrCreateIdentity();
      const title = form.title || `${form.vehicleType} – ${form.fromCity} to ${form.toCity}`;
      const pd    = form.priceDisplay || (form.price ? `MK ${Number(form.price).toLocaleString()}` : "Negotiable");

      const { data, error: err } = await authedClient(identity.token)
        .from("listings")
        .insert([{
          operator_token: identity.token,
          device_fingerprint: identity.fingerprint,
          title,
          description: form.description || `${form.vehicleType} available from ${form.fromCity}.${form.coverOtherRoutes?" Other routes on request.":""}`.trim(),
          vehicle_type: form.vehicleType,
          category: "Transport & Delivery",
          location: form.location,
          from_city: form.fromCity,
          to_city: form.toCity,
          covers_other_routes: form.coverOtherRoutes,
          price_type: form.priceType,
          price: form.price ? Number(form.price) : null,
          price_display: pd,
          is_online: form.isOnline,
          tags: [form.vehicleType, ...form.tags].filter(Boolean),
          whatsapp: form.whatsapp || null,
          phone: form.phone || null,
          status: "active",
        }])
        .select("id")
        .single();

      if (err) throw new Error(err.message);
      setListingId(data?.id ?? null);
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to post. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Image handlers ──────────────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !listingId) return;
    if (images.length >= 2) { setImgErr("Maximum 2 images allowed."); return; }
    setImgUp(true); setImgErr("");
    try {
      const img = await uploadListingImage(listingId, operatorToken, file, images.length as 0|1);
      setImages(prev => [...prev, img]);
    } catch (e: any) {
      setImgErr(e.message ?? "Upload failed.");
    } finally {
      setImgUp(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async (img: ListingImage) => {
    setImgErr("");
    try {
      await deleteListingImage(img);
      setImages(prev => prev.filter(i => i.id !== img.id));
    } catch (e: any) { setImgErr(e.message ?? "Could not remove."); }
  };

  // ── SUCCESS ─────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="w-full max-w-lg mx-auto px-4 pt-10 pb-36">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-green-600"/>
      </div>
      <h2 className="text-2xl font-black mb-1 text-center">You're Live! 🎉</h2>
      <p className="text-sm text-muted-foreground mb-5 text-center">
        Your listing is now visible to passengers across Malawi.
      </p>

      {/* ── Photo upload ── */}
      <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Camera size={15} className="text-teal-500"/>
          <h3 className="text-sm font-black">Add Vehicle Photos</h3>
          <span className="ml-auto text-[10px] text-muted-foreground font-bold">{images.length}/2</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Listings with photos get <span className="text-teal-500 font-bold">3× more bookings.</span> Add your vehicle or yourself.
        </p>

        <div className="flex gap-3 mb-2 flex-wrap">
          {images.map(img => (
            <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-teal-500/40 shrink-0">
              <img src={img.url} alt="listing photo" className="w-full h-full object-cover"/>
              <button onClick={() => handleRemove(img)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-600 transition-all">
                <X size={10} className="text-white"/>
              </button>
              {img.position === 0 && (
                <span className="absolute bottom-1 left-1 text-[8px] bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-bold">Cover</span>
              )}
            </div>
          ))}

          {images.length < 2 && (
            <button onClick={() => fileRef.current?.click()} disabled={imgUploading}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-teal-500 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-teal-500 transition-all active:scale-95 disabled:opacity-50 shrink-0">
              {imgUploading
                ? <Loader2 size={20} className="animate-spin"/>
                : <><ImagePlus size={20}/><span className="text-[10px] font-semibold">Add Photo</span></>
              }
            </button>
          )}
        </div>

        {imgError && <p className="text-xs text-red-500 mb-2">{imgError}</p>}
        <p className="text-[10px] text-muted-foreground">JPEG · PNG · WebP · max 5 MB each</p>

        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden" onChange={handleFile}/>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
        <Shield size={14} className="text-amber-600 shrink-0 mt-0.5"/>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Your listing is tied to this device. Edit or delete from Dashboard using the same browser.
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setDone(false); setStep(0); setImages([]);
            setForm(f => ({ ...f, title:"", description:"", price:"", priceDisplay:"", tags:[] })); }}
          className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all">
          Post Another
        </button>
        <button onClick={() => setLocation("/dashboard")}
          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-black hover:bg-teal-500 transition-all active:scale-95">
          My Listings
        </button>
      </div>
      {listingId && (
        <button onClick={() => setLocation(`/transport/${listingId}`)}
          className="mt-3 w-full text-xs text-teal-600 hover:underline text-center block">
          Preview listing →
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-5 pb-36">
      <div className="mb-5">
        <h1 className="text-xl font-black mb-0.5">List Your Vehicle</h1>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield size={11} className="text-green-500"/> No account needed — secured to this device
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button onClick={() => i < step && setStep(i)}
              className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black transition-all ${
                i < step  ? "bg-green-500 text-white cursor-pointer" :
                i === step ? "bg-teal-600 text-white" :
                "bg-muted text-muted-foreground cursor-default"
              }`}>
              {i < step ? "✓" : i + 1}
            </button>
            <span className={`text-[10px] font-semibold hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? "bg-green-500" : "bg-border"}`}/>}
          </div>
        ))}
      </div>

      {/* ── STEP 0 ── */}
      {step === 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-2 block">Vehicle Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map(t => (
                <button key={t} onClick={() => set("vehicleType", t)}
                  className={`py-2.5 px-1 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center gap-1 ${
                    form.vehicleType === t ? "bg-teal-600 border-teal-600 text-white" : "border-border text-muted-foreground hover:border-teal-400"
                  }`}>
                  <span className="text-lg">{VEHICLE_ICONS[t]}</span>{t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1.5 block">Listing Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder={`e.g. ${form.vehicleType} – Lilongwe City Rides`}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
            <p className="text-[10px] text-muted-foreground mt-1">Min 5 characters</p>
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Tell passengers about your vehicle, experience, areas you cover..."
              rows={3} className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-teal-500 transition-all"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["whatsapp","WhatsApp","999123456"],["phone","Phone","888123456"]].map(([k,l,ph]) => (
              <div key={k}>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1.5 block">{l}</label>
                <div className="flex gap-1.5">
                  <span className="flex items-center px-2 py-2.5 bg-muted border border-input rounded-xl text-xs text-muted-foreground shrink-0">+265</span>
                  <input value={form[k as keyof typeof form] as string}
                    onChange={e => set(k, e.target.value.replace(/\D/g,""))}
                    placeholder={ph} maxLength={9}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-3">
            {[["fromCity","From *"],["toCity","To *"]].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                  <MapPin size={10}/> {label}
                </label>
                <div className="relative">
                  <select value={form[key as keyof typeof form] as string}
                    onChange={e => { set(key, e.target.value); if (key==="fromCity") set("location",e.target.value); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none appearance-none focus:border-teal-500 pr-8">
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.coverOtherRoutes} onChange={e => set("coverOtherRoutes",e.target.checked)} className="accent-teal-500 w-4 h-4"/>
            <span className="text-xs text-muted-foreground">I also cover other routes on request</span>
          </label>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1.5 block flex items-center gap-1">
              <Banknote size={10}/> Pricing
            </label>
            <div className="flex gap-2">
              <div className="relative">
                <select value={form.priceType} onChange={e => set("priceType",e.target.value)}
                  className="pl-3 pr-7 py-2.5 rounded-xl border border-input bg-background text-sm outline-none appearance-none focus:border-teal-500">
                  {PRICE_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
              </div>
              <input value={form.price} onChange={e => set("price",e.target.value.replace(/\D/g,""))}
                placeholder="e.g. 8000" type="tel"
                className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Amount in Malawi Kwacha — leave blank if negotiable</p>
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1.5 block">Custom Price Label (optional)</label>
            <input value={form.priceDisplay} onChange={e => set("priceDisplay",e.target.value)}
              placeholder={`e.g. From MK ${Number(form.price||0).toLocaleString()} per trip`}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-teal-500 transition-all"/>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-card border border-card-border rounded-xl p-4">
            <div>
              <div className="text-sm font-bold">Available Right Now?</div>
              <div className="text-xs text-muted-foreground">Show a green "Online" badge on your listing</div>
            </div>
            <button onClick={() => set("isOnline",!form.isOnline)}
              className={`w-12 h-6 rounded-full transition-all relative ${form.isOnline?"bg-green-500":"bg-muted"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isOnline?"left-6":"left-0.5"}`}/>
            </button>
          </div>
          {form.isOnline && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"/>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">You'll appear in the Live Availability Feed!</p>
            </div>
          )}
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-2 block flex items-center gap-1">
              <Tag size={10}/> Features & Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.tags.includes(tag) ? "bg-teal-600 border-teal-600 text-white" : "border-border text-muted-foreground hover:border-teal-400"
                  }`}>{tag}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="animate-in fade-in duration-200 space-y-3">
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{VEHICLE_ICONS[form.vehicleType]}</span>
              <h2 className="text-sm font-black">Review Your Listing</h2>
            </div>
            {[
              ["Vehicle", form.vehicleType],
              ["Title", form.title || `${form.vehicleType} – ${form.fromCity} to ${form.toCity}`],
              ["Route", `${form.fromCity} → ${form.toCity}`],
              ["Price", form.price ? `MK ${Number(form.price).toLocaleString()} (${form.priceType})` : "Negotiable"],
              ["WhatsApp", form.whatsapp ? `+265 ${form.whatsapp}` : "Not set"],
              ["Phone", form.phone ? `+265 ${form.phone}` : "Not set"],
              ["Status", form.isOnline ? "🟢 Online" : "⚪ Offline"],
              ["Tags", form.tags.length ? form.tags.join(", ") : "None"],
            ].map(([l,v]) => (
              <div key={l} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground font-semibold w-20 shrink-0">{l}</span>
                <span className="text-foreground font-bold">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Camera size={14} className="text-teal-600 shrink-0 mt-0.5"/>
            <p className="text-xs text-teal-700 dark:text-teal-300">
              After publishing you can <strong>add up to 2 photos</strong> — listings with photos get far more bookings.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── NAV ── */}
      <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s-1)}
              className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all">
              Back
            </button>
          )}
          {step < STEPS.length-1 ? (
            <button onClick={() => setStep(s => s+1)} disabled={!canNext()}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-40">
              Continue →
            </button>
          ) : (
            <button onClick={submit} disabled={loading || !identityReady}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> Publishing...</>
                : <><Zap size={14}/> Publish Listing</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
