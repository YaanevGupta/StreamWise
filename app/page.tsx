"use client";

import React, { useState, useEffect, useCallback } from 'react';

const API_KEY = "4fc6a47b97ec18dfac76412f452bd211"; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const THUMB_BASE = "https://image.tmdb.org/t/p/w500";

const LANGUAGES = [
  { id: 'all', name: "Global" }, { id: 'hi', name: "Hindi" },
  { id: 'en', name: "English" }, { id: 'te', name: "Telugu" },
  { id: 'ta', name: "Tamil" }, { id: 'ko', name: "Korean" },
  { id: 'ml', name: "Malayalam" }, { id: 'kn', name: "Kannada" }
];

const GENRES = [
  { id: 28, name: "Action" }, { id: 35, name: "Comedy" },
  { id: 878, name: "Sci-Fi" }, { id: 27, name: "Horror" },
  { id: 18, name: "Drama" }, { id: 10749, name: "Romance" },
  { id: 16, name: "Animation" }, { id: 99, name: "Documentary" }
];

export default function StreamWiseRestore() {
  const [sectors, setSectors] = useState<Record<string, any[]>>({});
  const [activeLang, setActiveLang] = useState('all');
  const [activeGenre, setActiveGenre] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_vault_final');
    if (saved) {
      try { setWishlist(JSON.parse(saved)); } catch (e) { setWishlist([]); }
    }
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_vault_final', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      let endpoints = [];
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      const liveSync = `&t=${new Date().getTime()}`;

      if (searchQuery.trim().length > 0) {
        endpoints = [{ key: `Results: ${searchQuery}`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&include_adult=false${liveSync}` }];
      } else {
        const langLabel = LANGUAGES.find(l => l.id === activeLang)?.name;
        endpoints = [
          { key: `${langLabel} Blockbusters`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc${liveSync}` },
          { key: `Trending Globally`, url: `/trending/all/week?api_key=${API_KEY}${liveSync}` },
          { key: `Recent Series`, url: `/discover/tv?api_key=${API_KEY}${langQ}${genreQ}&sort_by=first_air_date.desc${liveSync}` }
        ];
      }

      const results = await Promise.allSettled(
        endpoints.map(e => fetch(`${BASE_URL}${e.url}`, { cache: 'no-store' }).then(res => res.json()))
      );

      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value.results) {
          resObj[endpoints[i].key] = res.value.results.filter((m: any) => m.poster_path).slice(0, 40);
        }
      });
      setSectors(resObj);
    } catch (e) { console.error("Sync Error"); }
  }, [searchQuery, activeLang, activeGenre, isMounted]);

  useEffect(() => {
    syncSystem();
  }, [syncSystem]);

  const openIntel = async (movie: any) => {
    setSelected(movie);
    try {
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const [cRes, pRes] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/watch/providers?api_key=${API_KEY}`).then(r => r.json())
      ]);
      setCast(cRes.cast?.slice(0, 12) || []);
      const loc = pRes.results?.IN || pRes.results?.US || Object.values(pRes.results || {})[0] || {};
      const raw = [...(loc.flatrate || []), ...(loc.buy || []), ...(loc.rent || [])];
      const unique: any[] = [];
      const seen = new Set();
      raw.forEach((p: any) => {
        if (!seen.has(p.provider_name)) { seen.add(p.provider_name); unique.push(p); }
      });
      setProviders(unique);
    } catch { setProviders([]); }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#0A070B] text-white min-h-screen font-sans">
      <nav className="fixed top-0 w-full z-[500] bg-[#0A070B]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSearchQuery(""); setShowWishlist(false);}}>
                <div className="w-1.5 h-8 bg-fuchsia-600 shadow-[0_0_15px_fuchsia]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowWishlist(!showWishlist)} className="text-[10px] font-bold uppercase text-white/40 hover:text-fuchsia-500">Vault ({wishlist.length})</button>
                <input type="text" value={searchQuery} placeholder="SEARCH..." onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[10px] focus:border-fuchsia-600 w-32 md:w-64 outline-none" />
            </div>
        </div>
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar flex items-center gap-3">
            {LANGUAGES.map((l) => (
              <button key={l.id} onClick={() => setActiveLang(l.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${activeLang === l.id ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-500'}`}>{l.name}</button>
            ))}
        </div>
      </nav>

      <main className="px-6 md:px-16 pt-48 pb-20">
        {showWishlist ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {wishlist.map(m => (
              <div key={m.id} onClick={() => openIntel(m)} className="aspect-[2/3] rounded-3xl overflow-hidden border border-white/10 cursor-pointer hover:scale-95 transition-transform">
                <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover" alt="p" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-32">
            {Object.entries(sectors).map(([title, items]) => (
              <section key={title}>
                <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30 mb-8">{title}</h3>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                  {items.map((m) => (
                    <div key={m.id} onClick={() => openIntel(m)} className="shrink-0 w-40 md:w-56 cursor-pointer">
                      <div className="aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 hover:border-fuchsia-600 transition-all">
                        <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover" alt="p" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/90" onClick={() => setSelected(null)}>
          <div className="relative bg-[#0F0D12] w-full max-w-5xl rounded-[3rem] border border-white/10 overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            <div className="md:w-1/2 p-10 md:p-16">
                <h2 className="text-4xl font-black uppercase italic mb-4">{selected.title || selected.name}</h2>
                <p className="text-zinc-500 text-sm mb-8">{selected.overview}</p>
                <div className="flex gap-4">
                    <button onClick={() => {
                        const exists = wishlist.find(x => x.id === selected.id);
                        if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                        else setWishlist([...wishlist, selected]);
                    }} className="px-8 py-3 rounded-full bg-fuchsia-600 text-[10px] font-black uppercase">
                        {wishlist.find(x => x.id === selected.id) ? 'Remove Vault' : 'Add Vault'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}