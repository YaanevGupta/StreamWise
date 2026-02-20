"use client";

import React, { useState, useEffect, useCallback } from 'react';

// CORE ENGINE CONSTANTS
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

export default function StreamWiseIroncladFinal() {
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

  // 1. STABLE HYDRATION & BACK BUTTON LOGIC
  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_premium_vault');
    if (saved) setWishlist(JSON.parse(saved));

    // Handle Browser Back Button
    const handlePopState = () => {
      if (selected) setSelected(null);
      else if (showWishlist) setShowWishlist(false);
      else if (searchQuery) setSearchQuery("");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selected, showWishlist, searchQuery]);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_premium_vault', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  // 2. REFINED SYNC ENGINE
  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      let endpoints = [];
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";

      if (searchQuery.trim().length > 0) {
        endpoints = [{ key: `Search Results`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else {
        const langLabel = LANGUAGES.find(l => l.id === activeLang)?.name;
        endpoints = [
          { key: `Trending Now`, url: `/trending/all/week?api_key=${API_KEY}` },
          { key: `IMDB Legends`, url: `/movie/top_rated?api_key=${API_KEY}${langQ}` },
          { key: `${langLabel} Blockbusters`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` },
          { key: `Upcoming`, url: `/movie/upcoming?api_key=${API_KEY}${langQ}` }
        ];
      }

      const results = await Promise.all(endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json())));
      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => {
        if (res.results) resObj[endpoints[i].key] = res.results.filter((m: any) => m.poster_path).slice(0, 40);
      });
      setSectors(resObj);
    } catch (e) { console.error("Sync Error"); }
  }, [searchQuery, activeLang, activeGenre, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  // 3. APP RELOCATION & DATA FETCH
  const openIntel = async (movie: any) => {
    window.history.pushState({ modal: true }, ""); // Adds a "Back" point for the browser
    setSelected(movie);
    try {
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const [cRes, pRes] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/watch/providers?api_key=${API_KEY}`).then(r => r.json())
      ]);
      setCast(cRes.cast?.slice(0, 12) || []);
      const loc = pRes.results?.IN || pRes.results?.US || Object.values(pRes.results || {})[0] || {};
      const unique: any[] = [];
      const seen = new Set();
      [...(loc.flatrate || []), ...(loc.buy || []), ...(loc.rent || [])].forEach((p: any) => {
        if (!seen.has(p.provider_name)) { seen.add(p.provider_name); unique.push(p); }
      });
      setProviders(unique);
    } catch { setProviders([]); }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#0A070B] text-white min-h-screen font-sans selection:bg-fuchsia-600/40 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-[800] bg-[#0A070B]/95 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSearchQuery(""); setShowWishlist(false); setActiveLang('all'); setActiveGenre(0);}}>
                <div className="w-1.5 h-8 bg-fuchsia-600 shadow-[0_0_20px_fuchsia]" />
                <span className="text-xs font-black uppercase tracking-[0.5em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-6">
                <button onClick={() => setShowWishlist(!showWishlist)} className={`text-[10px] font-black uppercase tracking-widest ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>Vault ({wishlist.length})</button>
                <input 
                    type="text" value={searchQuery} placeholder="SEARCH..." 
                    onChange={(e) => {setSearchQuery(e.target.value); setShowWishlist(false);}}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-40 md:w-96" 
                />
            </div>
        </div>

        {/* CATEGORY BUTTONS - FIXED CLICKABILITY */}
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar relative z-[900]">
          <div className="inline-flex items-center gap-4">
            <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.id} onClick={(e) => { e.stopPropagation(); setActiveLang(l.id); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeLang === l.id ? 'bg-white text-black' : 'border-white/10 text-zinc-500 hover:text-white'}`}>{l.name}</button>
                ))}
            </div>
            <div className="w-[1px] h-4 bg-white/20" />
            <div className="flex gap-2">
                {GENRES.map((g) => (
                  <button key={g.id} onClick={(e) => { e.stopPropagation(); setActiveGenre(g.id); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-white/10 text-zinc-400 hover:text-white'}`}>{g.name}</button>
                ))}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="px-6 md:px-16 pt-52 pb-40">
        <div className="space-y-40">
          {Object.entries(showWishlist ? { "Your Vault": wishlist } : sectors).map(([title, items]) => (
            <section key={title}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 mb-10 flex items-center gap-4">
                 <span className="w-10 h-[1px] bg-fuchsia-600" /> {title}
              </h3>
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-10">
                {items?.map((m, idx) => (
                  <div key={`${m.id}-${idx}`} onClick={() => openIntel(m)} className="shrink-0 w-44 md:w-64 group cursor-pointer relative">
                    <div className="aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/5 relative z-10 group-hover:border-fuchsia-600 transition-all shadow-2xl bg-zinc-900">
                      <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="p" />
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10">
                          <span className="text-[10px] font-black text-fuchsia-500">{(m.vote_average || 0).toFixed(1)} ★</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* MODAL / PORTAL */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelected(null)} />
          <div className="relative bg-[#0F0D12] w-full max-w-7xl h-[85vh] rounded-[3.5rem] border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="md:w-3/5 relative p-12 flex flex-col justify-end">
              <img src={`${IMAGE_BASE}${selected.backdrop_path || selected.poster_path}`} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="b" />
              <div className="relative z-10">
                <button onClick={() => setSelected(null)} className="mb-8 text-[10px] font-black uppercase tracking-widest text-fuchsia-500 flex items-center gap-2">← Back to Records</button>
                <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter italic mb-6 leading-none">{selected.title || selected.name}</h2>
                <div className="flex gap-4 mb-8">
                    <button onClick={() => {
                        const exists = wishlist.find(x => x.id === selected.id);
                        if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                        else setWishlist([...wishlist, selected]);
                    }} className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 border-fuchsia-600' : 'bg-white/10 border border-white/10'}`}>
                        {wishlist.find(x => x.id === selected.id) ? '✓ Saved' : '+ Save to Vault'}
                    </button>
                    <button onClick={() => window.open(`https://www.imdb.com/find?q=${encodeURIComponent(selected.title || selected.name)}`, '_blank')} className="px-10 py-4 rounded-full bg-[#f3ce13] text-black text-[10px] font-black uppercase tracking-widest">IMDB Archive</button>
                </div>
                <p className="text-zinc-500 text-sm md:text-lg italic max-w-xl line-clamp-3 leading-relaxed">"{selected.overview || "No description available."}"</p>
              </div>
            </div>

            <div className="md:w-2/5 p-12 overflow-y-auto no-scrollbar border-l border-white/5 bg-white/[0.01]">
                <p className="text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">Streaming Nodes & Pricing</p>
                <div className="grid gap-3">
                    {providers.map((p, i) => (
                        <div key={i} onClick={() => window.open(`https://www.google.com/search?q=watch+${encodeURIComponent(selected.title || selected.name)}+on+${p.provider_name}`, '_blank')} className="flex items-center justify-between bg-white/5 p-5 rounded-[2rem] border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                            <div className="flex items-center gap-4">
                                <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-8 h-8 rounded-lg" alt="L" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{p.provider_name}</span>
                            </div>
                            {/* PRICE / AMOUNT LABEL ADDED */}
                            <span className="text-[9px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20 uppercase tracking-tighter">Premium</span>
                        </div>
                    ))}
                    {providers.length === 0 && <p className="text-[9px] text-zinc-500 uppercase font-black">Scanning external nodes...</p>}
                </div>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mt-12 mb-8">Personnel</p>
                <div className="flex flex-wrap gap-2">
                    {cast.map((c, i) => (
                        <button key={i} onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(c.name)}`, '_blank')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase hover:bg-fuchsia-600 transition-all">{c.name}</button>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}