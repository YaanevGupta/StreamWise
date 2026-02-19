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

export default function StreamWiseFinal() {
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

  // 1. HYDRATION PROTECTION (Prevents initial load errors)
  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_master_vault_final');
    if (saved) {
      try { setWishlist(JSON.parse(saved)); } catch (e) { setWishlist([]); }
    }
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_master_vault_final', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  // 2. INFINITE SYNC ENGINE
  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      let endpoints = [];
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";

      if (searchQuery.trim().length > 0) {
        // GLOBAL SEARCH: Finds everything available on TMDB
        endpoints = [{ key: `Results: ${searchQuery}`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&include_adult=false` }];
      } else {
        const langLabel = LANGUAGES.find(l => l.id === activeLang)?.name;
        endpoints = [
          { key: `${langLabel} Blockbusters`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` },
          { key: `Trending Now`, url: `/trending/all/week?api_key=${API_KEY}` },
          { key: `${langLabel} Series`, url: `/discover/tv?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` }
        ];
      }

      const results = await Promise.allSettled(
        endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json()))
      );

      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value.results) {
          resObj[endpoints[i].key] = res.value.results.filter((m: any) => m.poster_path).slice(0, 40);
        }
      });
      setSectors(resObj);
    } catch (e) { console.error("Neural Link Error"); }
  }, [searchQuery, activeLang, activeGenre, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  // 3. DOSSIER INTEL FETCH
  const openIntel = async (movie: any) => {
    setSelected(movie);
    try {
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const [cRes, pRes] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/watch/providers?api_key=${API_KEY}`).then(r => r.json())
      ]);
      setCast(cRes.cast?.slice(0, 14) || []);
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

  const toggleWishlist = (movie: any) => {
    setWishlist(prev => {
      const exists = prev.find(m => m.id === movie.id);
      if (exists) return prev.filter(m => m.id !== movie.id);
      return [...prev, movie];
    });
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#0A070B] text-white min-h-screen font-sans selection:bg-fuchsia-600/40 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <nav className="fixed top-0 w-full z-[500] bg-[#0A070B]/95 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-6">
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => {setSearchQuery(""); setShowWishlist(false); setActiveLang('all'); setActiveGenre(0);}}>
                <div className="w-1.5 h-8 bg-fuchsia-600 shadow-[0_0_20px_fuchsia]" />
                <span className="text-xs font-black uppercase tracking-[0.5em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-6">
                <button onClick={() => setShowWishlist(!showWishlist)} className={`text-[10px] font-black uppercase tracking-widest transition-all ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>
                    Vault ({wishlist.length})
                </button>
                <input 
                    type="text" value={searchQuery} placeholder="TYPE ANY MOVIE OR SHOW..." 
                    onChange={(e) => {setSearchQuery(e.target.value); setShowWishlist(false);}}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-40 md:w-96 transition-all" 
                />
            </div>
        </div>

        {/* SIDEWAYS CATEGORIES: NO WRAPPING */}
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="inline-flex items-center gap-4 min-w-full">
            <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.id} onClick={() => {setActiveLang(l.id); setSearchQuery("");}} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${activeLang === l.id ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-500'}`}>{l.name}</button>
                ))}
            </div>
            <div className="w-[1px] h-4 bg-white/20 shrink-0 mx-2" />
            <div className="flex gap-2">
                {GENRES.map((g) => (
                  <button key={g.id} onClick={() => {setActiveGenre(g.id); setSearchQuery("");}} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${activeGenre === g.id ? 'bg-fuchsia-600 border-fuchsia-600 shadow-lg shadow-fuchsia-500/20' : 'border-white/10 text-zinc-400'}`}>{g.name}</button>
                ))}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN DYNAMIC CONTENT */}
      <main className="px-6 md:px-16 pt-52 pb-40">
        {showWishlist ? (
          <section className="animate-in fade-in duration-500">
            <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-fuchsia-500 mb-14 flex items-center gap-4">
               <span className="w-10 h-[1px] bg-fuchsia-600" /> My Saved Archive
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                {wishlist.map(m => (
                    <div key={m.id} onClick={() => openIntel(m)} className="relative aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/10 cursor-pointer shadow-2xl">
                        <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover" alt="p" loading="lazy" />
                    </div>
                ))}
            </div>
            {wishlist.length === 0 && <div className="h-[40vh] flex items-center justify-center text-white/10 font-black uppercase tracking-[1em]">Archive Empty</div>}
          </section>
        ) : (
          <div className="space-y-40">
            {Object.entries(sectors).map(([title, items]) => (
              <section key={title}>
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 flex items-center gap-4">
                     <span className="w-10 h-[1px] bg-fuchsia-600" /> {title}
                  </h3>
                  <button onClick={() => {setSearchQuery(title.split(' ')[0]); window.scrollTo(0,0);}} className="text-[9px] font-black uppercase tracking-widest text-fuchsia-600 hover:text-white transition-all underline underline-offset-8">Explore Sector +</button>
                </div>
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-10 scroll-smooth">
                  {items.map((m) => (
                    <div key={m.id} onClick={() => openIntel(m)} className="shrink-0 w-44 md:w-64 group cursor-pointer transition-all">
                      <div className="aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/5 relative z-10 transition-all group-hover:border-fuchsia-600 shadow-2xl bg-zinc-900">
                        <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="p" loading="lazy" />
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-2 py-1 rounded-lg border border-white/10">
                            <span className="text-[9px] font-black text-fuchsia-500">{(m.vote_average || 0).toFixed(1)} ★</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* PORTAL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl animate-in fade-in" onClick={() => setSelected(null)} />
          <div className="relative bg-[#0F0D12] w-full max-w-7xl h-[85vh] rounded-[3.5rem] border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="md:w-3/5 relative p-12 flex flex-col justify-end">
              <img src={`${IMAGE_BASE}${selected.backdrop_path}`} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="b" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter italic mb-6 leading-none">{selected.title || selected.name}</h2>
                <div className="flex gap-4 mb-8">
                    <button onClick={() => toggleWishlist(selected)} className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 border-fuchsia-600 shadow-lg' : 'bg-white/10 border border-white/10 hover:bg-white hover:text-black'}`}>
                        {wishlist.find(x => x.id === selected.id) ? '✓ Saved' : '+ Save to Vault'}
                    </button>
                    <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title || selected.name)}+trailer`)} className="px-10 py-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 hover:text-white transition-all">Trailer</button>
                </div>
                <p className="text-zinc-500 text-sm md:text-lg italic max-w-xl line-clamp-3 leading-relaxed">"{selected.overview || "Database overview unavailable for this record."}"</p>
              </div>
            </div>
            <div className="md:w-2/5 p-12 overflow-y-auto no-scrollbar border-l border-white/5 bg-white/[0.01]">
                <p className="text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">Streaming Nodes</p>
                <div className="grid gap-3">
                    {providers.map(p => (
                        <div key={p.provider_id} className="flex items-center justify-between bg-white/5 p-5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-8 h-8 rounded-lg shadow-sm" alt="L" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{p.provider_name}</span>
                            </div>
                            <span className="text-[8px] font-black opacity-30">Active</span>
                        </div>
                    ))}
                    {providers.length === 0 && <p className="text-[9px] text-white/20 uppercase font-black">No Direct Nodes Found</p>}
                </div>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mt-12 mb-8">Wikipedia Personnel</p>
                <div className="flex flex-wrap gap-2">
                    {cast.map(c => (
                        <button key={c.id} onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(c.name)}`, '_blank')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase hover:bg-fuchsia-600 transition-all">{c.name}</button>
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