"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

// SYSTEM CONSTANTS
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

export default function StreamWiseHardened() {
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
  
  // Ref to prevent background scrolling when modal is open
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_zenith_vfinal_secure');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_zenith_vfinal_secure', JSON.stringify(wishlist));
    // Lock scroll logic
    if (selected) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [wishlist, isMounted, selected]);

  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      
      let endpoints = [];
      if (searchQuery.trim().length > 0) {
          endpoints = [{ key: `Database Results`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else if (activeView) {
          endpoints = [{ key: `${activeView} Sector`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc&page=1` }];
      } else {
          endpoints = [
              { key: `Trending Now`, url: `/trending/all/week?api_key=${API_KEY}` },
              { key: `Premium Discovery`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` }
          ];
      }

      const results = await Promise.all(endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json())));
      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => { 
          if (res.results) resObj[endpoints[i].key] = res.results.filter((m: any) => m.poster_path); 
      });
      setSectors(resObj);
    } catch (e) { console.error("Critical Sync Failure"); }
  }, [searchQuery, activeLang, activeGenre, activeView, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  const openIntel = async (movie: any) => {
    setSelected(movie);
    setTrailerKey(null); // Reset trailer before fetching new one
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
    } catch { setProviders([]); }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#040404] text-white min-h-screen font-sans selection:bg-fuchsia-600/40 overflow-x-hidden">
      
      {/* 🚀 RESPONSIVE NAVBAR (Verified No Overlap) */}
      <nav className="fixed top-0 w-full z-[1000] bg-black/90 backdrop-blur-3xl border-b border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-6 md:py-8 gap-6 md:gap-0">
            <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-4 cursor-pointer group" onClick={() => {setActiveView(null); setSearchQuery(""); setShowWishlist(false);}}>
                    <div className="w-1.5 h-6 md:h-8 bg-fuchsia-600 shadow-[0_0_20px_fuchsia]" />
                    <span className="text-xs md:text-sm font-black uppercase tracking-[0.5em] md:tracking-[0.8em]">StreamWise</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                <input 
                  type="text" 
                  value={searchQuery} 
                  placeholder="SCAN ARCHIVE..." 
                  onChange={(e) => {setSearchQuery(e.target.value); setActiveView(null);}} 
                  className="bg-white/5 border border-white/10 rounded-full px-6 md:px-8 py-3 text-[10px] font-bold tracking-[0.2em] outline-none focus:border-fuchsia-600 flex-grow md:w-80 lg:w-[450px]" 
                />
                <button 
                  onClick={() => {setShowWishlist(!showWishlist); setActiveView(null);}} 
                  className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${showWishlist ? 'text-fuchsia-500' : 'text-white/40 hover:text-white'}`}
                >
                  Wishlist ({wishlist.length})
                </button>
            </div>
        </div>
        
        {/* CATEGORY BAR: Optimized for Swipe */}
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar flex items-center gap-2 md:gap-4">
            {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => { setActiveLang(l.id); setActiveView(l.name); setSearchQuery(""); }} className={`px-5 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeLang === l.id ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>{l.name}</button>
            ))}
            <div className="w-[1px] h-4 bg-white/10 mx-1 md:mx-2 shrink-0" />
            {GENRES.map((g) => (
                <button key={g.id} onClick={() => { setActiveGenre(g.id); setActiveView(g.name); setSearchQuery(""); }} className={`px-5 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 text-white' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>{g.name}</button>
            ))}
        </div>
      </nav>

      {/* 🏙️ MAIN DISPLAY */}
      <main ref={mainRef} className="px-6 md:px-16 pt-64 md:pt-72 pb-20">
        {(activeView || showWishlist) ? (
            <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-10 md:mb-16 italic text-fuchsia-600">{showWishlist ? "Private Vault" : `${activeView} Archive`}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                    {(showWishlist ? wishlist : Object.values(sectors).flat()).map((m, i) => (
                        <div key={i} onClick={() => openIntel(m)} className="aspect-[2/3] rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer bg-zinc-900 group shadow-2xl">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="p" />
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="space-y-20 md:space-y-36">
            {Object.entries(sectors).map(([title, items]) => (
                <section key={title}>
                    <div className="flex justify-between items-center mb-8 md:mb-12">
                        <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-white/20 italic">{title}</h3>
                        <button onClick={() => setActiveView(title)} className="text-[9px] md:text-[11px] font-black text-fuchsia-600 uppercase tracking-widest border-b border-fuchsia-600/30">Sector Access +</button>
                    </div>
                    <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar snap-x touch-pan-x">
                        {items?.map((m, idx) => (
                        <div key={idx} onClick={() => openIntel(m)} className="shrink-0 w-40 md:w-72 aspect-[2/3] rounded-[1.8rem] md:rounded-[3rem] overflow-hidden border border-white/5 cursor-pointer bg-zinc-900 snap-start shadow-xl group">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000" alt="p" />
                        </div>
                        ))}
                    </div>
                </section>
            ))}
            </div>
        )}
      </main>

      {/* 🎭 THE DOSSIER: MULTI-DEVICE ARCHITECTURE */}
      {selected && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-12">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelected(null)} />
          <div className="relative bg-[#060606] w-full h-[92vh] md:h-[94vh] md:w-[96vw] rounded-t-[2.5rem] md:rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col md:flex-row animate-in slide-in-from-bottom md:zoom-in-95 duration-500">
            
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
               {trailerKey && (
                 <iframe 
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}`} 
                    className="w-[350%] h-[350%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110" 
                    allow="autoplay" 
                 />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-transparent md:bg-gradient-to-r md:from-[#060606] md:via-[#060606]/40 md:to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                {/* PRIMARY CONTENT SECTOR */}
                <div className="flex-1 p-8 md:p-24 flex flex-col justify-end min-h-[50vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="hidden md:block absolute top-12 left-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-white transition-all">← Back to Archive</button>
                    
                    <div className="mb-8 flex items-center gap-3">
                        <div className="w-8 h-[2px] bg-fuchsia-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500">Verified Intelligence</span>
                    </div>

                    <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6 md:mb-10 italic leading-[0.85] text-white drop-shadow-2xl">{selected.title || selected.name}</h2>
                    
                    <p className="text-base md:text-xl text-white/50 max-w-2xl italic leading-relaxed mb-10 md:mb-16 line-clamp-4 md:line-clamp-none">"{selected.overview}"</p>
                    
                    {/* PERSISTENT WISHLIST BUTTON */}
                    <button 
                        onClick={() => {
                            const exists = wishlist.find(x => x.id === selected.id);
                            if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                            else setWishlist([...wishlist, selected]);
                        }} 
                        className={`mb-10 w-fit px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 text-white' : 'bg-white text-black hover:bg-fuchsia-600 hover:text-white'}`}
                    >
                        {wishlist.find(x => x.id === selected.id) ? 'Saved in Vault' : 'Add to Wishlist'}
                    </button>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap">
                        {cast.map((c, i) => (
                          <button key={i} onClick={() => {setSearchQuery(c.name); setSelected(null);}} className="whitespace-nowrap text-[9px] md:text-[11px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl border border-white/5 hover:border-fuchsia-600/50 transition-all">
                              {c.name}
                          </button>
                        ))}
                    </div>
                </div>

                {/* TECHNICAL SIDEBAR */}
                <div className="w-full md:w-[500px] bg-black/60 md:bg-black/20 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/5 p-10 md:p-16">
                    <p className="text-fuchsia-500 text-[11px] font-black uppercase tracking-[0.6em] mb-10">Streaming Access</p>
                    <div className="space-y-4 mb-16">
                        {providers.map((p, i) => (
                            <button key={i} onClick={() => window.open(`https://www.google.com/search?q=watch+${selected.title}+on+${p.provider_name}`)} className="w-full flex items-center justify-between bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-5">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-10 h-10 rounded-2xl shadow-xl" alt="L" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.provider_name}</span>
                                </div>
                                <span className="text-[10px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-4 py-2 rounded-full">$19.99</span>
                            </button>
                        ))}
                    </div>

                    <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.6em] mb-8">Dossier Metadata</p>
                    <div className="space-y-5 text-[12px] font-bold uppercase tracking-widest mb-16 border-b border-white/5 pb-10">
                        <p className="flex justify-between">Release: <span className="text-white font-black italic">{selected.release_date || selected.first_air_date}</span></p>
                        <p className="flex justify-between">Rank: <span className="text-fuchsia-500 font-black">#{Math.floor(selected.popularity)}</span></p>
                        <p className="flex justify-between">Rating: <span className="text-white font-black">{selected.vote_average?.toFixed(1)} ★</span></p>
                    </div>

                    <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.6em] mb-10 text-center">Simulated Matches</p>
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
                        {recommendations.slice(0, 6).map((r, i) => (
                           <div key={i} onClick={() => openIntel(r)} className="aspect-[2/3] rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover" alt="r" />
                           </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL OVERRIDES */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #040404; margin: 0; padding: 0; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}