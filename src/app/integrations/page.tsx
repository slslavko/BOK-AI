"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, Plug, XCircle, Loader2 } from "lucide-react";

const KANALY = [
  { id: "allegro", name: "Allegro", desc: "Największy polski marketplace", logo: "/allegro.svg" },
  { id: "fb", name: "Facebook Marketplace", desc: "Sprzedaż przez Facebooka", logo: "/facebook.svg" },
  { id: "olx", name: "OLX", desc: "Ogłoszenia lokalne", logo: "/olx.svg" },
  { id: "amazon", name: "Amazon", desc: "Globalny marketplace", logo: "/amazon.svg" },
  { id: "emag", name: "eMag", desc: "Marketplace Europy Środkowej", logo: "/emag.svg" },
];

interface AllegroIntegration {
  connected: boolean;
  accountName?: string;
  lastSync?: string;
  environment: "sandbox" | "production";
}

export default function Integrations() {
  const [allegro, setAllegro] = useState<AllegroIntegration>({ connected: false, environment: "sandbox" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    checkAllegroConnection();
    // Obsługa powrotu z OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const allegroStatus = urlParams.get("allegro");
    if (allegroStatus === "connected") {
      setSuccess(true);
      setAllegro((prev) => ({ ...prev, connected: true }));
      window.history.replaceState({}, "", window.location.pathname);
    } else if (allegroStatus === "error") {
      setError(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const checkAllegroConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/allegro/status");
      if (response.ok) {
        const data = await response.json();
        setAllegro(data);
      }
    } catch (e) {
      setAllegro({ connected: false, environment: "sandbox" });
    } finally {
      setLoading(false);
    }
  };

  const connectToAllegro = async () => {
    setLoading(true);
    try {
      let tenantId = localStorage.getItem("tenantId") || "demo-tenant";
      const authUrl = `http://localhost:3001/api/allegro/auth?tenantId=${tenantId}`;
      window.location.href = authUrl;
    } catch (e) {
      setError(true);
      setLoading(false);
    }
  };

  const disconnectAllegro = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:3001/api/allegro/disconnect", { method: "POST" });
      setAllegro({ connected: false, environment: allegro.environment });
      setSuccess(false);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold mb-4">Integracje z kanałami sprzedaży</h1>
      <div className="grid grid-cols-1 gap-6">
        {KANALY.map((k) => (
          <div
            key={k.id}
            className="flex items-center gap-4 bg-white/10 rounded-xl p-5 shadow-lg backdrop-blur-xl border border-white/10"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow flex-shrink-0">
              <img src={k.logo} alt={k.name} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{k.name}</div>
              <div className="text-gray-600 dark:text-white/60 text-sm">{k.desc}</div>
              {k.id === "allegro" && allegro.connected && (
                <div className="text-xs mt-1 text-green-700 dark:text-green-300">
                  Połączono z Allegro ({allegro.environment})
                  {allegro.accountName && <span> jako <b>{allegro.accountName}</b></span>}
                  {allegro.lastSync && <span> • Ostatnia synchronizacja: {allegro.lastSync}</span>}
                </div>
              )}
            </div>
            {k.id === "allegro" ? (
              loading ? (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-300 font-medium flex-shrink-0"><Loader2 className="w-5 h-5 animate-spin" /> Ładowanie...</span>
              ) : allegro.connected ? (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white font-semibold shadow transition flex-shrink-0"
                  onClick={disconnectAllegro}
                >
                  <XCircle className="w-5 h-5" /> Odłącz Allegro
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/80 hover:bg-violet-600 text-white font-semibold shadow transition flex-shrink-0"
                  onClick={connectToAllegro}
                >
                  <Plug className="w-5 h-5" /> Połącz z Allegro
                </button>
              )
            ) : (
              <span className="flex items-center gap-1 text-gray-400 font-medium flex-shrink-0"><Plug className="w-5 h-5" /> Niedostępne</span>
            )}
          </div>
        ))}
      </div>
      {success && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Połączono z Allegro!
        </div>
      )}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" /> Błąd połączenia z Allegro. Spróbuj ponownie.
        </div>
      )}
    </div>
  );
} 