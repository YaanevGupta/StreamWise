"use client";

import React, { useState, useEffect, useCallback } from 'react';

const API_KEY = "4fc6a47b97ec18dfac76412f452bd211"; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const THUMB_BASE = "https://image.tmdb.org/t/p/w500";

export default function StreamWiseZenithFinal() {
  const [sectors, setSectors] = useState<Record<string, any[]>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 1. WISHLIST PERSISTENCE ENGINE (Verified No-Loophole)
  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_zenith_vfinal');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_zenith_vfinal', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  // 2. DATA SYNC (No Duplication)
  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      let endpoints = [
        { key: `Trending Intelligence`, url: `/trending/all/week?api_key=${API_KEY}` },
        { key: `Premium Discovery`, url: `/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc` }
      ];
      if (searchQuery.trim().length > 0) {
          endpoints = [{ key: `Search Results`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      }
      const results = await Promise.all(endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json())));
      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => { 
          if (res.results) resObj[endpoints[i].key] = res.results.filter((m: any) => m.poster_path); 
      });
      setSectors(resObj);
    } catch (e) { console.error("Link Severed"); }
  }, [searchQuery, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  // 3. THE DOSSIER LOGIC (HD TRAILER & PROVIDER FILTER)
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

      setCast(cRes.cast?.slice(0, 12) || []);
      setRecommendations(rRes.results?.slice(0, 8) || []);
      
      const trailer = vRes.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      setTrailerKey(trailer?.key || null);

      // PROVIDER DUPLICATION FIX
      const loc = pRes.results?.IN || pRes.results?.US || Object.values(pRes.results || {})[0] || {};
      const combined = [...(loc.flatrate || []), ...(loc.buy || []), ...(loc.rent || [])];
      const unique = Array.from(new Map(combined.map(item => [item.provider_id, item])).values());
      setProviders(unique.slice(0, 3));
    } catch { setProviders([]); }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[#020202] text-white min-h-screen font-sans selection:bg-fuchsia-600/30">
      
      {/* 🚀 ELITE NAV */}
      <nav className="fixed top-0 w-full z-[100] bg-black/90 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-8">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => {setSearchQuery(""); setShowWishlist(false);}}>
                <div className="w-1.5 h-6 bg-fuchsia-600 shadow-[0_0_15px_fuchsia]" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-6">
                <input type="text" value={searchQuery} placeholder="SEARCH DATABASE..." onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[9px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-40 md:w-80 transition-all" />
                <button onClick={() => setShowWishlist(!showWishlist)} className={`text-[9px] font-black uppercase tracking-widest transition-all ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>Wishlist ({wishlist.length})</button>
                <button onClick={() => setIsLoginOpen(true)} className="px-5 py-2 bg-white text-black text-[9px] font-black uppercase rounded-full hover:bg-fuchsia-600 hover:text-white transition-all">Login</button>
            </div>
        </div>
      </nav>

      {/* 🖼️ CONTENT GRID */}
      <main className="px-6 md:px-16 pt-48 pb-40">
        <div className="space-y-24">
            {Object.entries(showWishlist ? { "Private Vault": wishlist } : sectors).map(([title, items]) => (
                <section key={title}>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-8 italic">{title}</h3>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
                        {items?.map((m, idx) => (
                        <div key={idx} onClick={() => openDossier(m)} className="shrink-0 w-44 md:w-56 aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all bg-zinc-900 shadow-2xl group">
                            <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="p" />
                        </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
      </main>

      {/* 🎭 THE DOSSIER (Optimized) */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelected(null)} />
          <div className="relative bg-[#050505] w-full h-full md:h-[92vh] md:w-[96vw] md:rounded-[3rem] border border-white/10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            
            {/* 📺 HD BACKGROUND TRAILER (FIXED FIT) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
               {trailerKey && (
                 <div className="w-full h-full relative overflow-hidden">
                    <iframe 
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}&vq=hd1080&modestbranding=1`} 
                      className="absolute top-1/2 left-1/2 w-[115%] h-[115%] -translate-x-1/2 -translate-y-1/2 object-cover scale-110 opacity-40" 
                      allow="autoplay; encrypted-media"
                    />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                <div className="flex-1 p-8 md:p-20 flex flex-col justify-end">
                    <button onClick={() => setSelected(null)} className="absolute top-10 left-10 text-[9px] font-black uppercase text-white/30 hover:text-white transition-all">← CLOSE</button>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 italic drop-shadow-2xl">{selected.title || selected.name}</h2>
                    
                    <button onClick={() => {
                        const exists = wishlist.find(x => x.id === selected.id);
                        if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                        else setWishlist([...wishlist, selected]);
                    }} className={`w-fit px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all mb-10 ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600' : 'bg-white text-black'}`}>
                        {wishlist.find(x => x.id === selected.id) ? 'Remove from Vault' : '+ Add to Wishlist'}
                    </button>

                    <p className="text-base text-white/50 max-w-2xl italic leading-relaxed mb-10">"{selected.overview}"</p>
                    <div className="flex flex-wrap gap-2">
                        {cast.map((c, i) => (
                          <button key={i} onClick={() => {setSearchQuery(c.name); setSelected(null);}} className="text-[8px] font-black uppercase bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:text-fuchsia-500 transition-all">{c.name}</button>
                        ))}
                    </div>
                </div>

                {/* 🛡️ PREMIUM INTEL SIDEBAR */}
                <div className="w-full md:w-[450px] bg-black/60 backdrop-blur-3xl border-l border-white/10 p-10 overflow-y-auto no-scrollbar">
                    <p className="text-fuchsia-500 text-[9px] font-black uppercase tracking-[0.4em] mb-10">STREAMING NODES</p>
                    <div className="space-y-4 mb-16">
                        {providers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-8 h-8 rounded-lg" alt="L" />
                                    <span className="text-[10px] font-black uppercase">{p.provider_name}</span>
                                </div>
                                <span className="text-[9px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-3 py-1 rounded-full">$19.99</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em] mb-6 italic">More Information</p>
                    <div className="space-y-4 border-b border-white/5 pb-10 mb-10">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                            <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Release</span>
                            <span className="text-[10px] font-bold text-white italic">{selected.release_date || selected.first_air_date}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                            <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Global Rank</span>
                            <span className="text-[10px] font-bold text-fuchsia-500">#{Math.floor(selected.popularity)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                            <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Rating</span>
                            <span className="text-[10px] font-bold text-white italic">{selected.vote_average} ★</span>
                        </div>
                    </div>

                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em] mb-6 text-center">Related Intelligence</p>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map((r, i) => (
                           <div key={i} onClick={() => openDossier(r)} className="aspect-[2/3] rounded-xl overflow-hidden border border-white/5 cursor-pointer shadow-lg hover:border-fuchsia-600 transition-all">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover" alt="r" />
                           </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 OTP AUTH PORTAL (Gmail/Phone) */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsLoginOpen(false)} />
            <div className="relative bg-[#080808] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-lg animate-in zoom-in-95 duration-300">
                <div className="text-center mb-10">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Secure Link</h3>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.4em]">Identify to Mainframe</p>
                </div>
                <div className="space-y-6">
                    <button className="w-full flex items-center justify-center gap-4 bg-white text-black py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-fuchsia-600 hover:text-white transition-all">
                        Connect with Gmail
                    </button>
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-[1px] bg-white/5" />
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">OR</span>
                        <div className="flex-1 h-[1px] bg-white/5" />
                    </div>
                    <div className="space-y-4">
                        <input type="text" placeholder="PHONE NUMBER / GMAIL" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-[10px] font-black outline-none focus:border-fuchsia-600 transition-all" />
                        <button className="w-full bg-fuchsia-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(192,38,211,0.3)] transition-all">
                            Transmit OTP
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}