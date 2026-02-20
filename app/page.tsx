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

export default function StreamWiseAbsoluteFinal() {
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
  const [minRating, setMinRating] = useState(0);
  const [releaseYear, setReleaseYear] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    const saved = localStorage.getItem('sw_absolute_vault');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('sw_absolute_vault', JSON.stringify(wishlist));
  }, [wishlist, isMounted]);

  const syncSystem = useCallback(async () => {
    if (!isMounted) return;
    try {
      const langQ = activeLang !== 'all' ? `&with_original_language=${activeLang}` : "";
      const genreQ = activeGenre !== 0 ? `&with_genres=${activeGenre}` : "";
      const yearQ = releaseYear ? `&primary_release_year=${releaseYear}` : "";
      const voteQ = `&vote_average.gte=${minRating}`;
      
      let endpoints = [];
      if (searchQuery.trim().length > 0) {
        endpoints = [{ key: `Archive Results: ${searchQuery}`, url: `/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}` }];
      } else {
        endpoints = [
          { key: `Trending Globally`, url: `/trending/all/week?api_key=${API_KEY}${voteQ}` },
          { key: `Premium Discovery`, url: `/discover/movie?api_key=${API_KEY}${langQ}${genreQ}${yearQ}${voteQ}&sort_by=popularity.desc` },
          { key: `IMDB Legends`, url: `/movie/top_rated?api_key=${API_KEY}${langQ}${voteQ}` }
        ];
      }

      const results = await Promise.all(endpoints.map(e => fetch(`${BASE_URL}${e.url}`).then(res => res.json())));
      const resObj: Record<string, any[]> = {};
      results.forEach((res, i) => { 
        if (res.results) resObj[endpoints[i].key] = res.results.filter((m: any) => m.poster_path).slice(0, 40); 
      });
      setSectors(resObj);
    } catch (e) { console.error("Archive Link Error"); }
  }, [searchQuery, activeLang, activeGenre, releaseYear, minRating, isMounted]);

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
      const trailer = vRes.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
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
      
      {/* 🛠️ NAVIGATION: Z-INDEX 999 PROTECTION */}
      <nav className="fixed top-0 w-full z-[999] bg-[#0A070B]/95 backdrop-blur-3xl border-b border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-6 gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSearchQuery(""); setActiveLang('all'); setMinRating(0); setReleaseYear(""); setShowWishlist(false); setViewAllSector(null);}}>
                <div className="w-1.5 h-8 bg-fuchsia-600 shadow-[0_0_20px_fuchsia]" />
                <span className="text-xs font-black uppercase tracking-[0.6em]">StreamWise</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
                <input type="text" value={searchQuery} placeholder="SEARCH DATABASE..." onChange={(e) => {setSearchQuery(e.target.value); setShowWishlist(false);}} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest outline-none focus:border-fuchsia-600 w-64 lg:w-96" />
                <input type="number" placeholder="YEAR" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-black w-24 outline-none focus:border-fuchsia-600" />
                <select onChange={(e) => setMinRating(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-black outline-none text-white cursor-pointer appearance-none min-w-[120px]">
                    <option value="0" className="bg-black">ALL RATINGS</option>
                    <option value="7" className="bg-black">7.0+ STARS</option>
                    <option value="8" className="bg-black">8.0+ STARS</option>
                </select>
                <button onClick={() => setShowWishlist(!showWishlist)} className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase transition-all ${showWishlist ? 'bg-fuchsia-600 border-fuchsia-600 shadow-lg' : 'border-white/10 text-white/40'}`}>Vault ({wishlist.length})</button>
            </div>
        </div>

        <div className="px-6 md:px-16 pb-6 overflow-x-auto no-scrollbar flex gap-4 items-center">
            {LANGUAGES.map((l) => (
              <button key={l.id} onClick={() => { setSearchQuery(""); setActiveLang(l.id); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeLang === l.id ? 'bg-white text-black' : 'border-white/10 text-zinc-500 hover:text-white'}`}>{l.name}</button>
            ))}
            <div className="w-[1px] h-4 bg-white/20" />
            {GENRES.map((g) => (
              <button key={g.id} onClick={() => { setSearchQuery(""); setActiveGenre(g.id); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeGenre === g.id ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-white/10 text-zinc-400 hover:text-white'}`}>{g.name}</button>
            ))}
        </div>
      </nav>

      {/* 🎞️ MAIN FEED */}
      <main className="px-6 md:px-16 pt-64 pb-40">
        <div className="space-y-44">
          {Object.entries(showWishlist ? { "Saved Intel": wishlist } : sectors).map(([title, items]) => {
            const isExpanded = viewAllSector === title;
            return (
              <section key={title} className="animate-in fade-in duration-1000">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 flex items-center gap-4"><span className="w-10 h-[1px] bg-fuchsia-600" /> {title}</h3>
                  <button onClick={() => setViewAllSector(isExpanded ? null : title)} className="text-[9px] font-black text-fuchsia-600 uppercase underline underline-offset-8 decoration-fuchsia-600/30 hover:text-white transition-all">{isExpanded ? "Collapse" : "Explore Sector +"}</button>
                </div>
                <div className={`${isExpanded ? 'grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-8' : 'flex gap-8 overflow-x-auto no-scrollbar pb-10'}`}>
                  {items?.map((m, idx) => (
                    <div key={`${m.id}-${idx}`} onClick={() => openIntel(m)} className={`${isExpanded ? 'w-full' : 'shrink-0 w-48 md:w-72'} group cursor-pointer relative`}>
                      <div className="aspect-[2/3] rounded-[3rem] overflow-hidden border border-white/5 relative z-10 transition-all group-hover:border-fuchsia-600 bg-zinc-900 shadow-2xl">
                        <img src={`${THUMB_BASE}${m.poster_path}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="p" />
                        <div className="absolute top-6 right-6 z-20 bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 group-hover:border-fuchsia-600 transition-all opacity-0 group-hover:opacity-100">
                           <span className="text-[10px] font-black text-fuchsia-500">{(m.vote_average || 0).toFixed(1)} ★</span>
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

      {/* 🎭 THE CINEMATIC MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" onClick={() => setSelected(null)} />
          
          <div className="relative bg-[#0F0D12] w-full h-full md:h-[92vh] md:w-[96vw] md:rounded-[4rem] border border-white/10 overflow-hidden shadow-3xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
               {trailerKey ? (
                 <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0`} className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 brightness-50" />
               ) : (
                 <img src={`${IMAGE_BASE}${selected.backdrop_path}`} className="w-full h-full object-cover opacity-20" alt="bg" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D12] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row overflow-y-auto no-scrollbar">
                <div className="flex-1 p-8 md:p-24 flex flex-col justify-end min-h-[70vh] md:min-h-0">
                    <button onClick={() => setSelected(null)} className="absolute top-12 left-12 text-[10px] font-black uppercase text-white/40 hover:text-white transition-all flex items-center gap-2">← Back to Archive</button>
                    <h2 className="text-5xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.75] mb-8 italic drop-shadow-2xl">{selected.title || selected.name}</h2>
                    
                    <div className="flex flex-wrap gap-4 mb-10">
                        <button onClick={() => {
                            const exists = wishlist.find(x => x.id === selected.id);
                            if (exists) setWishlist(wishlist.filter(x => x.id !== selected.id));
                            else setWishlist([...wishlist, selected]);
                        }} className={`px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wishlist.find(x => x.id === selected.id) ? 'bg-fuchsia-600 shadow-lg' : 'bg-white text-black hover:bg-fuchsia-600 hover:text-white'}`}>{wishlist.find(x => x.id === selected.id) ? 'Locked in Vault' : '+ Save to Vault'}</button>
                        <button onClick={() => window.open(`https://www.imdb.com/find?q=${selected.title || selected.name}`)} className="px-12 py-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">IMDB Intel</button>
                    </div>

                    <p className="text-xl md:text-2xl text-white/50 max-w-3xl leading-relaxed italic mb-12">"{selected.overview || "No database description available for this node."}"</p>
                    
                    <div className="flex flex-wrap gap-2">
                        {cast.map((c, i) => (
                          <button key={i} onClick={() => { setSearchQuery(c.name); setSelected(null); }} className="text-[10px] font-black uppercase text-white/40 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 hover:border-fuchsia-600 hover:text-fuchsia-500 transition-all">{c.name}</button>
                        ))}
                    </div>
                </div>

                <div className="w-full md:w-[500px] bg-black/70 backdrop-blur-3xl border-l border-white/10 p-12 overflow-y-auto no-scrollbar">
                    <p className="text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10">Streaming Status</p>
                    <div className="space-y-4 mb-20">
                        {providers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/5 p-6 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-5">
                                    <img src={`${IMAGE_BASE}${p.logo_path}`} className="w-10 h-10 rounded-2xl shadow-lg" alt="L" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.provider_name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-fuchsia-500 bg-fuchsia-500/10 px-4 py-1.5 rounded-full border border-fuchsia-500/20 block mb-1">${Math.floor(selected.popularity || 0)} VAL</span>
                                    <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">↑ TRENDING</span>
                                </div>
                            </div>
                        ))}
                        {providers.length === 0 && <p className="text-[10px] font-black uppercase text-white/20">Scanning Global Providers...</p>}
                    </div>

                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-8">Related Nodes</p>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map((r, i) => (
                           <div key={i} onClick={() => openIntel(r)} className="aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer hover:border-fuchsia-600 transition-all group">
                              <img src={`${THUMB_BASE}${r.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="r" />
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