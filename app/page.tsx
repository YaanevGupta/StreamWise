"use client";

import React, { useState, useEffect, useCallback } from 'react';

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

export default function StreamWiseZeroBug() {
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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // LOOPHOLE FIX: Hydration Safety
  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_wishlist_v3');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_wishlist_v3', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  // LOOPHOLE FIX: Unified Data Sync (Prevents Category vs Search conflicts)
  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      
      let endpoints = [];
      if (searchQuery.trim().length > 0) {
        endpoints = [{ key: `Search Results`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else if (activeView) {
          endpoints = [{ key: `${activeView} Sector`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` }];
      } else {
        endpoints = [
          { key: `Trending Now`, url: `/trending/all/week?api_key=${API_KEY}` },
          { key: `IMDB Legends`, url: `/movie/top_rated?api_key=${API_KEY}${langQ}` },
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
    setTrailerKey(null); // Loophole fix: reset trailer before loading new one
    try {
      const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      const [cRes, pRes, vRes, rRes] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/watch/providers?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/videos?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${movie.id}/recommendations?api_key=${API_KEY}`).then(r => r.json())
      ]);
      setCast(cRes.cast?.slice(0, 15) || []);
      setRecommendations(rRes.results?.slice(0, 10) || []);
      const trailer = vRes.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      setTrailerKey(trailer?.key || null);
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
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-fuchsia-600/40">
      
      {/* 🚀 NAV: FIXING Z-INDEX & ALIGNMENT */}
      <nav className="fixed top-0 w-full z-[1000] bg-black/80 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-8">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => {setActiveView(null); setSearchQuery(""); setShowWishlist(false); setActiveGenre(0);}}>
                <div className="w-1.5 h-10 bg-fuchsia-600 shadow-[0_0_25px_fuchsia]" />
                <span className="text-[11px] font-black uppercase tracking-[0.8em]">StreamWise</span>
            </div>
            
            <div className="flex items-center gap-8">
                <input type="text" value={searchQuery} placeholder="SEARCH SYSTEM..." 
                    onChange={(e) => {setSearchQuery(e.target.value); setActiveView(null); setShowWishlist(false);}} 
                    className="bg-white/5 border border-white/10 rounded-full px-8 py-4 text-[10px] font-black tracking-[0.2em] outline-none focus:border-fuchsia-600 w-48 lg:w-[400px] transition-all" 
                />
                <button onClick={() => {setShowWishlist(!showWishlist); setActiveView(null);}} className={`text-[10px] font-black uppercase tracking-widest transition-all ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>Wishlist ({wishlist.length})</button>
                <button onClick={() => setIsLoginOpen(true)} className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase rounded-full hover:bg-fuchsia-600 hover:text-white transition-all">Agent Login</button>
            </div>
        </div>

        {/* PREMIUM FILTERS: FIXING CLICK ACTION */}
        <div className="px-6 md:px-16 pb-8 overflow-x-auto no-scrollbar flex items-center gap-4">
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {LANGUAGES.map((l) => (
                    <button key={l.id} onClick={() => { setActiveLang(l.id); setActiveView(l.name); setSearchQuery(""); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeLang === l.id && activeView === l.name ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>{l.name}</button>
                ))}
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {GENRES.map((g) => (
                    <button key={g.id} onClick={() => { setActiveGenre(g.id); setActiveView(g.name); setSearchQuery(""); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeGenre === g.id && activeView === g.name ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:text-white'}`}>{g.name}</button>
                ))}
            </div>
        </div>
      </nav>

      {/* 🖼️ DYNAMIC GRID: DEDICATED SECTOR PAGES */}
      <main className="px-6 md:px-16 pt-72 pb-40">
        {activeView || showWishlist ? (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-center justify-between mb-16">
                    <h2 className="text-5xl font-black uppercase tracking-tighter italic">{showWishlist ? "Private Wishlist" : `${activeView} Sector`}</h2>
                    <button onClick={() => {setActiveView(null); setShowWishlist(false);}} className="text-[10px] font-black uppercase tracking-widest border-b border-fuchsia-600 pb-1">Back to Mainframe</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
                    {(showWishlist ? wishlist : Object.values(sectors).flat()).map((m, i) => (
                        <div key={i} onClick={() => openIntel(m)} className="group cursor-pointer">
                            <div className="aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/5 group-hover:border-fuchsia-600 transition-all bg-zinc-900 shadow-2xl">
                                <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="space-y-48">
            {Object.entries(sectors).map(([title, items]) => (
                <section key={title}>
                <div className="flex justify-between items-center mb-12">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.8em] text-white/20 flex items-center gap-4"><span className="w-12 h-[1px] bg-fuchsia-600" /> {title}</h3>
                    <button onClick={() => setActiveView(title)} className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600 hover:text-white transition-all underline underline-offset-8">Explore More +</button>
                </div>
                <div className="flex gap-8 overflow-x-auto no-scrollbar pb-10">
                    {items?.slice(0, 15).map((m, idx) => (
                    <div key={`${m.id}-${idx}`} onClick={() => openIntel(m)} className="shrink-0 w-48 md:w-72 group cursor-pointer">
                        <div className="aspect-[2/3] rounded-[3rem] overflow-hidden border border-white/5 relative z-10 transition-all group-hover:border-fuchsia-600 bg-zinc-900 shadow-2xl">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000" />
                        </div>
                    </div>
                    ))}
                </div>
                </section>
            ))}
            </div>
        )}
      </main>

      {/* 🎭 THE DOSSIER: ALIGNMENT & SOUND FIX */}
      {selected && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setSelected(null)} />
          
          <div className="relative bg-[#080808] w-full h-full md:h-[92vh] md:w-[95vw] md:rounded-[4rem] border border-white/10 overflow-hidden shadow-3xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            
            {/* TRAILER BACKGROUND WITH SOUND LOOPHOLE FIX */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
               {trailerKey ? (
                 <iframe 
                   src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1`} 
                   className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                 />
               ) : (
                 <img src={`${IMAGE_BASE}${selected.backdrop_path}`} className="w-full h-full object-cover" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                
                {/* TITLES & ALIGNMENT FIX */}
                <div className="flex-1 p-8 md:p-24 flex flex-col justify-end min-h-[60vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="absolute top-12 left-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white">← Exit Dossier</button>
                    
                    <h2 className="text-6xl md:text-[8rem] font-black uppercase tracking-tighter leading-[0.75] mb-12 italic">{selected.title || selected.name}</h2>

                    <div className="flex flex-wrap gap-4 mb-12">
                        <button onClick={() => {
                            const exists = wishlist.find(x => x.id === selected.id);
                            if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                            else setWishlist([...wishlist, selected]);
                        }} className={`px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600' : 'bg-white text-black hover:bg-fuchsia-600 hover:text-white'}`}>
                            {wishlist.find(x => x.id === selected.id) ? 'In Wishlist' : '+ Wishlist'}
                        </button>
                        <button onClick={() => setIsMuted(!isMuted)} className="px-6 py-5 rounded-full bg-white/10 border border-white/10 text-[10px]">{isMuted ? '🔇 Muted' : '🔊 Sound On'}</button>
                    </div>

                    <p className="text-xl md:text-2xl text-white/40 max-w-2xl leading-relaxed italic mb-16">"{selected.overview || "Transmission missing. No description found in database."}"</p>
                    
                    <div className="flex flex-wrap gap-3">
                        {cast.map((c, i) => (
                          <span key={i} className="text-[10px] font-black uppercase text-white/30 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">{c.name}</span>
                        ))}
                    </div>
                </div>

                {/* CURRENCY & NODES FIX */}
                <div className="w-full md:w-[500px] bg-black/80 backdrop-blur-3xl border-l border-white/10 p-12 overflow-y-auto no-scrollbar">
                    <p className="text-fuchsia-500 text-[11px] font-black uppercase tracking-[0.4em] mb-12">Streaming Nodes</p>
                    <div className="space-y-6 mb-24">
                        {providers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.03] p-8 rounded-[3rem] border border-white/5">
                                <div className="flex items-center gap-6">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-12 h-12 rounded-2xl" />
                                    <span className="text-[12px] font-black uppercase tracking-widest">{p.provider_name}</span>
                                </div>
                                <span className="text-[10px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-6 py-2 rounded-full border border-fuchsia-500/20">₹{Math.floor(selected.popularity * 10)} / $VAL</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-center">Related Data Nodes</p>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map((r, i) => (
                           <div key={i} onClick={() => openIntel(r)} className="aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover" />
                           </div>
                        ))}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}

      {/* 🔐 LOGIN MODAL FIX */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsLoginOpen(false)} />
            <div className="relative bg-[#0F0F0F] border border-white/10 p-16 rounded-[4rem] w-full max-w-lg shadow-3xl animate-in zoom-in-90 duration-300">
                <h3 className="text-4xl font-black uppercase tracking-tighter italic mb-8 text-center">Agent Access</h3>
                <div className="space-y-4">
                    <input type="email" placeholder="IDENTIFIER" className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-5 text-[10px] font-black outline-none focus:border-fuchsia-600" />
                    <input type="password" placeholder="CLEARANCE CODE" className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-5 text-[10px] font-black outline-none focus:border-fuchsia-600" />
                    <button className="w-full bg-white text-black py-5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-fuchsia-600 hover:text-white transition-all shadow-xl">Authenticate</button>
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}