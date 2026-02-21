"use client";

import React, { useState, useEffect, useCallback } from 'react';

// CORE SYSTEM CONSTANTS
const API_KEY = "4fc6a47b97ec18dfac76412f452bd211"; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const THUMB_BASE = "https://image.tmdb.org/t/p/w500";

const LANGUAGES = [
  { id: 'all', name: "Global" }, { id: 'hi', name: "Hindi" },
  { id: 'en', name: "English" }, { id: 'te', name: "Telugu" },
  { id: 'ta', name: "Tamil" }, { id: 'ko', name: "Korean" }
];

const GENRES = [
  { id: 28, name: "Action" }, { id: 35, name: "Comedy" },
  { id: 878, name: "Sci-Fi" }, { id: 27, name: "Horror" },
  { id: 18, name: "Drama" }
];

export default function StreamWiseObsidianHardened() {
  const [sectors, setSectors] = useState<Record<string, any[]>>({});
  const [activeLang, setActiveLang] = useState('all');
  const [activeGenre, setActiveGenre] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 1. SAFE HYDRATION & PERSISTENCE
  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_obsidian_master_v1');
    if (saved) {
        try { setWishlist(JSON.parse(saved)); } 
        catch (e) { console.error("Archive Corrupted"); }
    }
  }, []);

  // 2. SCROLL LOCK & LOCAL STORAGE SYNC
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('sw_obsidian_master_v1', JSON.stringify(wishlist));
    
    if (selected) {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
    } else {
        document.body.style.overflow = 'unset';
        document.body.style.touchAction = 'auto';
    }
  }, [wishlist, isMounted, selected]);

  // 3. SECURE DATA ORCHESTRATION
  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      
      let endpoints = [];
      if (searchQuery.trim().length > 0) {
          endpoints = [{ key: `Search Intel`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else if (activeView) {
          endpoints = [{ key: `${activeView} Archive`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc&page=1` }];
      } else {
          endpoints = [
              { key: `Curated Selection`, url: `/trending/all/week?api_key=${API_KEY}` },
              { key: `Premium Archive`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` }
          ];
      }

      const results = await Promise.all(endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json())));
      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => { 
          if (res.results) resObj[endpoints[i].key] = res.results.filter((m: any) => m.poster_path); 
      });
      setSectors(resObj);
    } catch (e) { console.error("Critical System Breach"); }
  }, [searchQuery, activeLang, activeGenre, activeView, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  // 4. THE DOSSIER LOGIC (Loophole Free)
  const openIntel = async (movie: any) => {
    // Immediate state reset to prevent previous movie data "ghosting"
    setCast([]);
    setProviders([]);
    setTrailerKey(null);
    setRecommendations([]);
    setSelected(movie);

    try {
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const [cRes, pRes, vRes, rRes] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/watch/providers?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/videos?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/recommendations?api_key=${API_KEY}`).then(r => r.json())
      ]);
      setCast(cRes.cast?.slice(0, 15) || []);
      setRecommendations(rRes.results?.slice(0, 12) || []);
      const trailer = vRes.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      setTrailerKey(trailer?.key || null);
      const loc = pRes.results?.IN || pRes.results?.US || Object.values(pRes.results || {})[0] || {};
      setProviders([...(loc.flatrate || []), ...(loc.buy || [])].slice(0, 3));
    } catch { console.warn("Partial Intel Lost"); }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#020202] text-white min-h-screen font-sans selection:bg-fuchsia-600/60 overflow-x-hidden antialiased">
      
      {/* 🏛️ ELITE NAVIGATION */}
      <nav className="fixed top-0 w-full z-[1000] bg-black/40 backdrop-blur-[40px] border-b border-white/[0.03]">
        <div className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-8 md:py-10 gap-8 md:gap-0">
            <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-5 cursor-pointer group" onClick={() => {setActiveView(null); setSearchQuery(""); setShowWishlist(false);}}>
                    <div className="w-[3px] h-10 bg-fuchsia-600 shadow-[0_0_35px_rgba(192,38,211,0.8)] rounded-full transition-all duration-500" />
                    <span className="text-lg font-black uppercase tracking-[1em] text-white">StreamWise</span>
                </div>
            </div>
            
            <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto">
                <div className="relative flex-grow md:w-[500px]">
                  <input 
                    type="text" 
                    value={searchQuery} 
                    placeholder="SCAN INTELLIGENCE..." 
                    onChange={(e) => {setSearchQuery(e.target.value); setActiveView(null);}} 
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-full px-10 py-4 text-[11px] font-black tracking-[0.3em] outline-none focus:border-fuchsia-600 transition-all" 
                  />
                </div>
                <button onClick={() => {setShowWishlist(!showWishlist); setActiveView(null);}} className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all ${showWishlist ? 'text-fuchsia-500' : 'text-white/20 hover:text-white'}`}>
                  Vault ({wishlist.length})
                </button>
            </div>
        </div>
        
        <div className="px-8 md:px-20 pb-8 overflow-x-auto no-scrollbar flex items-center gap-4">
            {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => { setActiveLang(l.id); setActiveView(l.name); setSearchQuery(""); }} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${activeLang === l.id ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-zinc-500 hover:text-white'}`}>{l.name}</button>
            ))}
            <div className="w-[1px] h-6 bg-white/[0.05] mx-4 shrink-0" />
            {GENRES.map((g) => (
                <button key={g.id} onClick={() => { setActiveGenre(g.id); setActiveView(g.name); setSearchQuery(""); }} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-transparent border-white/10 text-zinc-500 hover:text-white'}`}>{g.name}</button>
            ))}
        </div>
      </nav>

      {/* 🖼️ THE GALLERY */}
      <main className="px-8 md:px-20 pt-[280px] md:pt-[320px] pb-32">
        {(activeView || showWishlist) ? (
            <div className="animate-in fade-in zoom-in-95 duration-1000">
                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-20 italic text-white">{showWishlist ? "Vault" : activeView}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12">
                    {(showWishlist ? wishlist : Object.values(sectors).flat()).map((m, i) => (
                        <div key={i} onClick={() => openIntel(m)} className="group aspect-[2/3] rounded-[2rem] md:rounded-[3rem] overflow-hidden cursor-pointer bg-zinc-950 border border-white/[0.05] transition-all hover:border-fuchsia-600/50">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" alt="p" />
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="space-y-40 md:space-y-60">
            {Object.entries(sectors).map(([title, items]) => (
                <section key={title}>
                    <div className="flex justify-between items-end mb-12 md:mb-16">
                        <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">{title}</h3>
                        <button onClick={() => setActiveView(title)} className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-fuchsia-600 transition-all">Full Sector +</button>
                    </div>
                    <div className="flex gap-8 md:gap-14 overflow-x-auto no-scrollbar snap-x touch-pan-x">
                        {items?.map((m, idx) => (
                        <div key={idx} onClick={() => openIntel(m)} className="shrink-0 w-52 md:w-[380px] aspect-[2/3] rounded-[2.5rem] md:rounded-[4.5rem] overflow-hidden cursor-pointer bg-zinc-950 snap-start border border-white/[0.03] group transition-all duration-700 hover:border-fuchsia-600/40">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" alt="p" />
                        </div>
                        ))}
                    </div>
                </section>
            ))}
            </div>
        )}
      </main>

      {/* 🎭 THE OBSIDIAN MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-12">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-[60px]" onClick={() => setSelected(null)} />
          <div className="relative bg-[#050505] w-full h-full md:rounded-[5rem] border border-white/[0.05] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-700">
            
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
               {trailerKey && (
                 <iframe 
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}`} 
                    className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-125" 
                    allow="autoplay" 
                 />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                
                <div className="flex-1 p-10 md:p-32 flex flex-col justify-end min-h-[60vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="absolute top-16 left-16 text-[11px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-white transition-all">← Back</button>
                    <h2 className="text-5xl md:text-9xl font-black uppercase tracking-tighter mb-10 italic leading-[0.8] text-white">{selected.title || selected.name}</h2>
                    <p className="text-lg md:text-2xl text-white/40 max-w-3xl italic leading-relaxed mb-16">"{selected.overview}"</p>
                    
                    <button 
                        onClick={() => {
                            const exists = wishlist.find(x => x.id === selected.id);
                            if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                            else setWishlist([...wishlist, selected]);
                        }} 
                        className={`w-fit px-16 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 text-white' : 'bg-white text-black hover:bg-fuchsia-600 hover:text-white'}`}
                    >
                        {wishlist.find(x => x.id === selected.id) ? 'Saved' : 'Secure Entry'}
                    </button>
                </div>

                <div className="w-full md:w-[600px] bg-black/40 backdrop-blur-[80px] border-t md:border-t-0 md:border-l border-white/[0.05] p-12 md:p-24 overflow-y-auto no-scrollbar">
                    <p className="text-fuchsia-600 text-[11px] font-black uppercase tracking-[0.8em] mb-12 italic">Carriers</p>
                    <div className="space-y-6 mb-20">
                        {providers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/[0.05]">
                                <div className="flex items-center gap-6">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-12 h-12 rounded-[1.2rem]" alt="l" />
                                    <span className="text-sm font-black uppercase tracking-[0.2em]">{p.provider_name}</span>
                                </div>
                                <span className="text-[10px] font-black text-fuchsia-500">$19.99</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6 text-[14px] text-white/40 font-bold uppercase tracking-[0.2em] mb-24 border-b border-white/[0.05] pb-12">
                        <p className="flex justify-between">Deployment: <span className="text-white">{selected.release_date || selected.first_air_date}</span></p>
                        <p className="flex justify-between">Global Rank: <span className="text-fuchsia-600">#{Math.floor(selected.popularity)}</span></p>
                        <p className="flex justify-between">Rating: <span className="text-white">{selected.vote_average?.toFixed(1)} / 10</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {recommendations.slice(0, 8).map((r, i) => (
                           <div key={i} onClick={() => openIntel(r)} className="aspect-[2/3] rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/[0.05] cursor-pointer hover:border-fuchsia-600 transition-all">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-700" alt="r" />
                           </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #020202; }
      `}</style>
    </div>
  );
}