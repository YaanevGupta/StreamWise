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

export default function StreamWiseFinalZenith() {
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_zenith_final_v1');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_zenith_final_v1', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      
      let endpoints = [];
      if (searchQuery.trim().length > 0) {
          endpoints = [{ key: `Results`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
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
    } catch (e) { console.error("Sync Failure"); }
  }, [searchQuery, activeLang, activeGenre, activeView, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  const openDossier = async (movie: any) => {
    setSelected(movie);
    setTrailerKey(null);
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
    <div className="bg-[#030303] text-white min-h-screen font-sans selection:bg-fuchsia-600/40">
      
      {/* 🚀 NAV */}
      <nav className="fixed top-0 w-full z-[100] bg-black/90 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-8">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => {setActiveView(null); setSearchQuery(""); setShowWishlist(false); setActiveGenre(0);}}>
                <div className="w-1.5 h-7 bg-fuchsia-600 shadow-[0_0_15px_fuchsia]" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-8">
                <input type="text" value={searchQuery} placeholder="SYSTEM SCAN..." onChange={(e) => {setSearchQuery(e.target.value); setActiveView(null);}} className="bg-white/5 border border-white/10 rounded-full px-8 py-2.5 text-[9px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-48 lg:w-96" />
                <button onClick={() => {setShowWishlist(!showWishlist); setActiveView(null);}} className={`text-[9px] font-black uppercase tracking-widest transition-all ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>Wishlist ({wishlist.length})</button>
                <button onClick={() => setIsLoginOpen(true)} className="px-6 py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-full hover:bg-fuchsia-600 hover:text-white transition-all">Login</button>
            </div>
        </div>
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar flex items-center gap-3">
            {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => { setActiveLang(l.id); setActiveView(l.name); setSearchQuery(""); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeLang === l.id ? 'bg-white text-black' : 'bg-white/5 text-zinc-500'}`}>{l.name}</button>
            ))}
            <div className="w-[1px] h-4 bg-white/10 mx-2" />
            {GENRES.map((g) => (
                <button key={g.id} onClick={() => { setActiveGenre(g.id); setActiveView(g.name); setSearchQuery(""); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 text-white' : 'bg-white/5 text-zinc-500'}`}>{g.name}</button>
            ))}
        </div>
      </nav>

      <main className="px-6 md:px-16 pt-64 pb-40">
        {(activeView || showWishlist) ? (
            <div className="animate-in fade-in duration-700">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-12 italic">{showWishlist ? "Private Vault" : `${activeView} Sector`}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {(showWishlist ? wishlist : Object.values(sectors).flat()).map((m, i) => (
                        <div key={i} onClick={() => openDossier(m)} className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all shadow-2xl bg-zinc-900">
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
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">{title}</h3>
                        <button onClick={() => setActiveView(title)} className="text-[9px] font-black text-fuchsia-600 uppercase tracking-widest border-b border-fuchsia-600">Full Sector +</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        {items?.map((m, idx) => (
                        <div key={idx} onClick={() => openDossier(m)} className="shrink-0 w-44 md:w-64 aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer group hover:border-fuchsia-600 transition-all bg-zinc-900 shadow-xl">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="p" />
                        </div>
                        ))}
                    </div>
                </section>
            ))}
            </div>
        )}
      </main>

      {/* 🎭 THE DOSSIER */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelected(null)} />
          <div className="relative bg-[#050505] w-full h-full md:h-[94vh] md:w-[96vw] md:rounded-[3rem] border border-white/10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            
            {/* TRAILER AUTO-SOUND: Mute=0 logic */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
               {trailerKey && (
                 <iframe 
                   src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}`} 
                   className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
                   allow="autoplay"
                 />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                <div className="flex-1 p-8 md:p-20 flex flex-col justify-end min-h-[55vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="absolute top-10 left-10 text-[9px] font-black uppercase tracking-[0.4em] text-white/30">← EXIT</button>
                    {/* REDUCED SIZE TITLE */}
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 italic drop-shadow-2xl">{selected.title || selected.name}</h2>
                    <p className="text-lg text-white/50 max-w-2xl italic leading-relaxed mb-10">"{selected.overview}"</p>
                    {/* ACTOR SEARCH: FIXED */}
                    <div className="flex flex-wrap gap-2">
                        {cast.map((c, i) => (
                          <button key={i} onClick={() => {setSearchQuery(c.name); setSelected(null); setActiveView(null);}} className="text-[9px] font-black uppercase bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 hover:text-fuchsia-500 transition-all">
                              {c.name}
                          </button>
                        ))}
                    </div>
                </div>

                <div className="w-full md:w-[450px] bg-black/70 backdrop-blur-3xl border-l border-white/10 p-10 overflow-y-auto no-scrollbar">
                    <p className="text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">STREAMING NODES</p>
                    <div className="space-y-4 mb-16">
                        {providers.map((p, i) => (
                            <button key={i} onClick={() => window.open(`https://www.google.com/search?q=watch+${selected.title}+on+${p.provider_name}`)} className="w-full flex items-center justify-between bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-9 h-9 rounded-xl" alt="L" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.provider_name}</span>
                                </div>
                                {/* $ AMOUNT FIXED */}
                                <span className="text-[10px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-4 py-1.5 rounded-full border border-fuchsia-500/20">$19.99</span>
                            </button>
                        ))}
                    </div>

                    {/* MORE INFORMATION: POPULATED */}
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-6">MORE INFORMATION</p>
                    <div className="space-y-3 text-[11px] font-bold mb-16 uppercase tracking-widest border-b border-white/5 pb-10">
                        <p className="flex justify-between">Release Date: <span className="text-white italic">{selected.release_date || selected.first_air_date || 'Unknown'}</span></p>
                        <p className="flex justify-between">Rating: <span className="text-fuchsia-500">{selected.vote_average?.toFixed(1)} ★</span></p>
                        <p className="flex justify-between">Language: <span className="text-white italic">{selected.original_language}</span></p>
                    </div>

                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-center">RELATED NODES</p>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map((r, i) => (
                           <div key={i} onClick={() => openDossier(r)} className="aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all shadow-lg">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover" alt="r" />
                           </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 LOGIN */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsLoginOpen(false)} />
            <div className="relative bg-[#0F0F0F] border border-white/10 p-12 rounded-[3rem] w-full max-w-lg animate-in zoom-in-90 duration-300 shadow-2xl">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 text-center">Agent Access</h3>
                <div className="space-y-4">
                    <input type="email" placeholder="IDENTIFIER" className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-4 text-[10px] font-black outline-none focus:border-fuchsia-600" />
                    <input type="password" placeholder="CLEARANCE CODE" className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-4 text-[10px] font-black outline-none focus:border-fuchsia-600" />
                    <button className="w-full bg-white text-black py-4 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-fuchsia-600 hover:text-white transition-all shadow-xl">Establish Link</button>
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}