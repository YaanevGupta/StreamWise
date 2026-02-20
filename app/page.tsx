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

export default function StreamWiseCinematic() {
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
  const [viewAllSector, setViewAllSector] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_cinematic_vault');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_cinematic_vault', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      let endpoints = [];

      if (searchQuery.trim().length > 0) {
        endpoints = [{ key: `Search Results`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else {
        endpoints = [
          { key: `Trending Now`, url: `/trending/all/week?api_key=${API_KEY}` },
          { key: `IMDB Top Rated`, url: `/movie/top_rated?api_key=${API_KEY}${langQ}` },
          { key: `${LANGUAGES.find(l => l.id === activeLang)?.name} Hits`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}&sort_by=popularity.desc` },
          { key: `New Arrivals`, url: `/movie/upcoming?api_key=${API_KEY}${langQ}` }
        ];
      }

      const results = await Promise.all(endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json())));
      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => { if (res.results) resObj[endpoints[i].key] = res.results.filter((m: any) => m.poster_path).slice(0, 40); });
      setSectors(resObj);
    } catch (e) { console.error("Sync Failure"); }
  }, [searchQuery, activeLang, activeGenre, isMounted]);

  useEffect(() => { syncSystem(); }, [syncSystem]);

  const openIntel = async (movie: any) => {
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
      const trailer = vRes.results?.find((v: any) => v.type === "Trailer");
      if (trailer) setTrailerKey(trailer.key);
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
      <nav className="fixed top-0 w-full z-[800] bg-[#0A070B]/90 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 md:px-16 py-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSearchQuery(""); setActiveLang('all'); setActiveGenre(0); setViewAllSector(null); setShowWishlist(false);}}>
                <div className="w-1.5 h-8 bg-fuchsia-600 shadow-[0_0_20px_fuchsia]" />
                <span className="text-xs font-black uppercase tracking-[0.6em]">StreamWise</span>
            </div>
            <div className="flex items-center gap-6">
                <button onClick={() => setShowWishlist(!showWishlist)} className={`text-[10px] font-black uppercase tracking-widest ${showWishlist ? 'text-fuchsia-500' : 'text-white/40'}`}>Vault ({wishlist.length})</button>
                <input type="text" value={searchQuery} placeholder="SYSTEM SCAN..." onChange={(e) => {setSearchQuery(e.target.value); setShowWishlist(false);}} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-44 md:w-96" />
            </div>
        </div>
        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar relative z-[900]">
          <div className="inline-flex items-center gap-4">
            {LANGUAGES.map((l) => (
              <button key={l.id} onClick={() => { setSearchQuery(""); setActiveLang(l.id); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeLang === l.id ? 'bg-white text-black' : 'border-white/10 text-zinc-500'}`}>{l.name}</button>
            ))}
            <div className="w-[1px] h-4 bg-white/20 mx-2" />
            {GENRES.map((g) => (
              <button key={g.id} onClick={() => { setSearchQuery(""); setActiveGenre(g.id); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-white/10 text-zinc-400'}`}>{g.name}</button>
            ))}
          </div>
        </div>
      </nav>

      <main className="px-6 md:px-16 pt-64 pb-40">
        <div className="space-y-44">
          {Object.entries(showWishlist ? { "Vault Archive": wishlist } : sectors).map(([title, items]) => {
            const isExpanded = viewAllSector === title;
            return (
              <section key={title}>
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 flex items-center gap-4"><span className="w-10 h-[1px] bg-fuchsia-600" /> {title}</h3>
                  <button onClick={() => setViewAllSector(isExpanded ? null : title)} className="text-[9px] font-black uppercase tracking-widest text-fuchsia-600 hover:text-white transition-all underline underline-offset-8 decoration-fuchsia-600/30">{isExpanded ? "Collapse" : "Explore More +"}</button>
                </div>
                <div className={`${isExpanded ? 'grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-8' : 'flex gap-8 overflow-x-auto no-scrollbar pb-10'}`}>
                  {items?.map((m, idx) => (
                    <div key={`${m.id}-${idx}`} onClick={() => openIntel(m)} className={`${isExpanded ? 'w-full' : 'shrink-0 w-48 md:w-72'} group cursor-pointer relative`}>
                      <div className="aspect-[2/3] rounded-[3rem] overflow-hidden border border-white/5 relative z-10 transition-all group-hover:border-fuchsia-600 bg-zinc-900 shadow-2xl">
                        <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000" alt="p" />
                        <div className="absolute bottom-6 left-6 right-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                           <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                              <p className="text-[10px] font-black uppercase truncate">{m.title || m.name}</p>
                              <p className="text-fuchsia-500 text-[9px] font-black mt-1">{(m.vote_average || 0).toFixed(1)} ★ RATIO</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelected(null)} />
          
          <div className="relative bg-[#0F0D12] w-full h-full md:h-[90vh] md:w-[95vw] md:rounded-[4rem] border border-white/10 overflow-hidden shadow-3xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            
            {/* CINEMATIC BACKGROUND TRAILER LAYER */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
               {trailerKey ? (
                 <iframe 
                   src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&showinfo=0`} 
                   className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                 />
               ) : (
                 <img src={`${IMAGE_BASE}${selected.backdrop_path}`} className="w-full h-full object-cover" alt="bg" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D12] via-[#0F0D12]/80 to-transparent" />
               <div className="absolute inset-0 bg-gradient-to-r from-[#0F0D12] via-transparent to-[#0F0D12]" />
            </div>

            {/* CONTENT LAYER - GLASS OVERLAY */}
            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                
                {/* LEFT: TITLES & DESCRIPTION */}
                <div className="flex-1 p-8 md:p-20 flex flex-col justify-end min-h-[60vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="absolute top-12 left-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-fuchsia-500 transition-all flex items-center gap-4">
                       <span className="w-8 h-[1px] bg-current" /> Close Dossier
                    </button>
                    
                    <h2 className="text-5xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.8] mb-8 italic drop-shadow-2xl">
                      {selected.title || selected.name}
                    </h2>

                    <div className="flex flex-wrap gap-4 mb-10">
                        <button onClick={() => {
                            const exists = wishlist.find(x => x.id === selected.id);
                            if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                            else setWishlist([...wishlist, selected]);
                        }} className={`px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 shadow-[0_0_30px_rgba(192,38,211,0.5)]' : 'bg-white text-black hover:bg-fuchsia-600 hover:text-white'}`}>
                            {wishlist.find(x => x.id === selected.id) ? 'Saved in Vault' : '+ Add to Archive'}
                        </button>
                        <button onClick={() => window.open(`https://www.imdb.com/find?q=${selected.title || selected.name}`)} className="px-12 py-5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">IMDB Intel</button>
                    </div>

                    <p className="text-xl md:text-2xl text-white/70 max-w-2xl leading-relaxed font-light italic mb-12">"{selected.overview}"</p>
                    
                    <div className="flex flex-wrap gap-2">
                        {cast.map((c, i) => (
                          <span key={i} className="text-[10px] font-black uppercase text-white/40 bg-white/5 px-4 py-2 rounded-lg border border-white/5">{c.name}</span>
                        ))}
                    </div>
                </div>

                {/* RIGHT: PROVIDERS & RECOMMENDATIONS */}
                <div className="w-full md:w-[450px] bg-black/40 backdrop-blur-3xl border-l border-white/10 p-12 overflow-y-auto no-scrollbar">
                    <p className="text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10">Active Nodes</p>
                    <div className="space-y-4 mb-16">
                        {providers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-5">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-10 h-10 rounded-xl" alt="L" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.provider_name}</span>
                                </div>
                                <span className="text-[9px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-4 py-1.5 rounded-full border border-fuchsia-500/20">${Math.floor(selected.popularity || 0)} VAL</span>
                            </div>
                        ))}
                        {providers.length === 0 && <p className="text-[10px] text-white/20 uppercase font-black">Scanning Global Channels...</p>}
                    </div>

                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-8">AI Discovery</p>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map((r, i) => (
                           <div key={i} onClick={() => openIntel(r)} className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover" alt="r" />
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
      `}</style>
    </div>
  );
}