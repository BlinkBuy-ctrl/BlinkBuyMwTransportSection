import { useState } from "react";
import { MessageCircle, Phone, ExternalLink } from "lucide-react";

export default function MessagesPage() {
  const [waNum, setWaNum] = useState("");
  const [message, setMessage] = useState("Hi, I found you on TransportMW!");

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-xl font-black mb-1">Contact Support</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Need help? Reach us directly on WhatsApp or phone.
      </p>

      <div className="space-y-3 mb-8">
        <a href="https://wa.me/265999626944?text=Hi+TransportMW+Support!"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 hover:border-green-400 transition-all active:scale-95">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle size={18} className="text-white"/>
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-green-700 dark:text-green-400">WhatsApp Support</div>
            <div className="text-xs text-muted-foreground">+265 999 626 944</div>
          </div>
          <ExternalLink size={14} className="text-muted-foreground"/>
        </a>

        <a href="tel:+265999626944"
          className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 hover:border-blue-400 transition-all active:scale-95">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Phone size={18} className="text-white"/>
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-blue-700 dark:text-blue-400">Call Support</div>
            <div className="text-xs text-muted-foreground">+265 999 626 944</div>
          </div>
          <ExternalLink size={14} className="text-muted-foreground"/>
        </a>
      </div>

      <div className="bg-card border border-card-border rounded-2xl p-4">
        <h2 className="text-sm font-black mb-3">Send a WhatsApp Message</h2>
        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Recipient Number (Optional)</label>
            <div className="flex gap-1.5">
              <span className="flex items-center px-2.5 bg-muted border border-input rounded-xl text-xs text-muted-foreground shrink-0">+265</span>
              <input value={waNum} onChange={e => setWaNum(e.target.value.replace(/\D/g,""))}
                placeholder="999626944"
                className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-green-500"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none resize-none focus:border-green-500"/>
          </div>
          <a
            href={`https://wa.me/265${waNum||"999626944"}?text=${encodeURIComponent(message)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-black transition-all active:scale-95">
            <MessageCircle size={15}/> Open in WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
