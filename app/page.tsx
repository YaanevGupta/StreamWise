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

export default function StreamWiseZenith() {
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

  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_wishlist_zenith');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_wishlist_zenith', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      
      let endpoints = [];
      if (searchQuery.trim().length > 0) {
          endpoints = [{ key: `Search Database`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else if (activeView) {
          endpoints = [{ key: `${activeView} Archive`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc&page=1` }];
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
    } catch (e) { console.error("Archive Link Error"); }
  }, [searchQuery, activeLang, activeGenre, activeView, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  const openIntel = async (movie: any) => {
    setSelected(movie);
    setTrailerKey(null); // Reset for new load
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
      const loc = pRes.results?.US || pRes.results?.IN || Object.values(pRes.results || {})[0] || {};
      setProviders([...(loc.flatrate || []), ...(loc.buy || [])].slice(0, 3));
    } catch { setProviders([]); }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-fuchsia-600/40">
      
      {/* 🚀 NAVIGATION */}
      <nav className="fixed top-0 w-full z-[1000] bg-black/80 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-8">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => {setActiveView(null); setSearchQuery(""); setShowWishlist(false);}}>
                <div className="w-1 h-8 bg-fuchsia-600 shadow-[0_0_20px_fuchsia]" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-8">
                <input type="text" value={searchQuery} placeholder="SYSTEM SCAN..." onChange={(e) => {setSearchQuery(e.target.value); setActiveView(null); setShowWishlist(false);}} className="bg-white/5 border border-white/10 rounded-full px-8 py-3 text-[10px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-64 lg:w-96" />
                <button onClick={() => {setShowWishlist(!showWishlist); setActiveView(null);}} className={`text-[10px] font-black uppercase tracking-widest transition-all ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>Wishlist ({wishlist.length})</button>
            </div>
        </div>
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar flex items-center gap-3">
            {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => { setActiveLang(l.id); setActiveView(l.name); setSearchQuery(""); }} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeLang === l.id ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>{l.name}</button>
            ))}
            <div className="w-[1px] h-4 bg-white/10 mx-2" />
            {GENRES.map((g) => (
                <button key={g.id} onClick={() => { setActiveGenre(g.id); setActiveView(g.name); setSearchQuery(""); }} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>{g.name}</button>
            ))}
        </div>
      </nav>

      {/* 🖼️ DYNAMIC GRID */}
      <main className="px-6 md:px-16 pt-64 pb-40">
        {(activeView || showWishlist) ? (
            <div className="animate-in fade-in duration-700">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-12 italic">{showWishlist ? "Private Wishlist" : `${activeView} Sector`}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {(showWishlist ? wishlist : Object.values(sectors).flat()).map((m, i) => (
                        <div key={i} onClick={() => openIntel(m)} className="aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all shadow-2xl">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover" alt="p" />
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="space-y-32">
            {Object.entries(sectors).map(([title, items]) => (
                <section key={title}>
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">{title}</h3>
                        <button onClick={() => setActiveView(title)} className="text-[9px] font-black text-fuchsia-600 uppercase tracking-widest border-b border-fuchsia-600">Explore Sector +</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        {items?.map((m, idx) => (
                        <div key={idx} onClick={() => openIntel(m)} className="shrink-0 w-44 md:w-64 aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer group hover:border-fuchsia-600 transition-all bg-zinc-900">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt="p" />
                        </div>
                        ))}
                    </div>
                </section>
            ))}
            </div>
        )}
      </main>

      {/* 🎭 THE DOSSIER (MODAL) */}
      {selected && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelected(null)} />
          <div className="relative bg-[#080808] w-full h-full md:h-[94vh] md:w-[96vw] md:rounded-[3rem] border border-white/10 overflow-hidden shadow-3xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            
            {/* AUTO-PLAY SOUND TRAILER: Mute=0 logic */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
               {trailerKey && (
                 <iframe 
                   src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}`} 
                   className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
                   allow="autoplay"
                 />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                
                {/* MOVIE INFO SECTOR */}
                <div className="flex-1 p-8 md:p-20 flex flex-col justify-end min-h-[60vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="absolute top-10 left-10 text-[9px] font-black uppercase tracking-[0.4em] text-white/30">← EXIT DOSSIER</button>
                    
                    {/* REDUCED SIZE TITLE */}
                    <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 italic drop-shadow-2xl">{selected.title || selected.name}</h2>
                    
                    <div className="flex gap-4 mb-8">
                         <button onClick={() => {
                            const exists = wishlist.find(x => x.id === selected.id);
                            if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                            else setWishlist([...wishlist, selected]);
                        }} className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 shadow-lg shadow-fuchsia-600/30' : 'bg-white text-black hover:bg-fuchsia-600 hover:text-white'}`}>
                            {wishlist.find(x => x.id === selected.id) ? 'In Wishlist' : '+ Wishlist'}
                        </button>
                    </div>

                    <p className="text-lg text-white/50 max-w-2xl italic leading-relaxed mb-12">"{selected.overview || "Information transmission pending..."}"</p>
                    
                    {/* ACTOR CLICKING FIXED */}
                    <div className="flex flex-wrap gap-2">
                        {cast.map((c, i) => (
                          <button key={i} onClick={() => {setSearchQuery(c.name); setSelected(null); setActiveView(null);}} className="text-[9px] font-black uppercase bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 hover:text-fuchsia-500 hover:border-fuchsia-600 transition-all">
                              {c.name}
                          </button>
                        ))}
                    </div>
                </div>

                {/* SIDEBAR ARCHIVE */}
                <div className="w-full md:w-[480px] bg-black/70 backdrop-blur-3xl border-l border-white/10 p-10 overflow-y-auto no-scrollbar">
                    
                    <p className="text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10">STREAMING NODES</p>
                    <div className="space-y-4 mb-16">
                        {providers.map((p, i) => (
                            <button key={i} onClick={() => window.open(`https://www.google.com/search?q=watch+${selected.title}+on+${p.provider_name}`)} className="w-full flex items-center justify-between bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-10 h-10 rounded-xl" alt="L" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.provider_name}</span>
                                </div>
                                {/* PRICE FIXED TO DOLLARS */}
                                <span className="text-[10px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-4 py-1.5 rounded-full border border-fuchsia-500/20 group-hover:bg-fuchsia-600 group-hover:text-white transition-all">$19.99</span>
                            </button>
                        ))}
                    </div>

                    {/* MORE INFORMATION SECTOR: POPULATED */}
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-8">MORE INFORMATION</p>
                    <div className="space-y-3 text-[11px] font-bold mb-16 uppercase tracking-widest border-b border-white/5 pb-10">
                        <p className="flex justify-between">Release Date: <span className="text-white italic">{selected.release_date || selected.first_air_date || 'Unknown'}</span></p>
                        <p className="flex justify-between">Global Rank: <span className="text-fuchsia-500">#{Math.floor(selected.popularity)}</span></p>
                        <p className="flex justify-between">Database Rating: <span className="text-white italic">{selected.vote_average?.toFixed(1)} ★</span></p>
                        <p className="flex justify-between">Media Type: <span className="text-white italic">{selected.media_type || 'Film'}</span></p>
                    </div>

                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-center">RELATED NODES</p>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map((r, i) => (
                           <div key={i} onClick={() => openIntel(r)} className="aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover" alt="r" />
                           </div>
                        ))}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}

      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}