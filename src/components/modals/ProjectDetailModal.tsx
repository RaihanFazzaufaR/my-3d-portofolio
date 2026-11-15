import React, { useState, useRef, useEffect } from 'react';
import type { PlanetData } from '../../data/portfolioData';

export interface ProjectDetailModalProps {
  planet: PlanetData | null;
  onClose: () => void;
  onPrevPlanet: () => void;
  onNextPlanet: () => void;
  onCopyText: (text: string, label: string) => void;
  copyStatus: string | null;
  onPlaySelect: () => void;
  onPlayHover: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  planet,
  onClose,
  onPrevPlanet,
  onNextPlanet,
  onCopyText,
  copyStatus,
  onPlaySelect,
  onPlayHover,
}) => {
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Reset filter when planet changes
  useEffect(() => {
    setSkillFilter('all');
    setIsFilterDropdownOpen(false);
  }, [planet?.id]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!planet) return null;

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label={planet.name}
      className="absolute top-20 right-4 md:right-8 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-6 pointer-events-auto"
    >
      {/* Header (Sticky / Fixed at top) */}
      <div className="p-6 pb-4 border-b border-slate-800 shrink-0 bg-slate-950/95 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: planet.color,
                boxShadow: `0 0 10px ${planet.color}`,
              }}
            />
            <span
              className="text-[10px] font-mono tracking-widest uppercase font-semibold"
              style={{ color: planet.color }}
            >
              {planet.sector}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-scifi">{planet.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{planet.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title="Close (Esc)"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable Body Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
        {/* 1. TECH STACK PLANET */}
        {planet.id === 'skills' && planet.skillsData && (
          <div className="py-4 space-y-4">
            {/* Custom Option-Value Selector for Tech Stack */}
            <div ref={filterDropdownRef} className="relative z-20">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  CATEGORY FILTER:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {skillFilter === 'all'
                    ? `All (${planet.skillsData.reduce((acc, c) => acc + c.skills.length, 0)} items)`
                    : `${planet.skillsData.find((c) => c.title === skillFilter)?.skills.length || 0} items`}
                </span>
              </div>

              {/* Custom Select Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  onPlaySelect();
                  setIsFilterDropdownOpen((prev) => !prev);
                }}
                onMouseEnter={onPlayHover}
                aria-haspopup="listbox"
                aria-expanded={isFilterDropdownOpen}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl flex items-center justify-between text-xs font-mono transition shadow-inner cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_#38bdf8]" />
                  <span className="text-white font-medium truncate">
                    {skillFilter === 'all' ? 'All Categories (Full Stack)' : skillFilter}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-sky-400 transition shrink-0 ml-2">
                  <span className="text-[10px] text-slate-500 group-hover:text-sky-400">SELECT</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180 text-sky-400' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Custom Option Values Popup Menu */}
              {isFilterDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-slate-950/98 border border-sky-500/40 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.85)] z-30 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={skillFilter === 'all'}
                    onClick={() => {
                      setSkillFilter('all');
                      setIsFilterDropdownOpen(false);
                      onPlaySelect();
                    }}
                    onMouseEnter={onPlayHover}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                      skillFilter === 'all'
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${skillFilter === 'all' ? 'bg-slate-950' : 'bg-slate-600'}`}
                      />
                      <span>All Categories</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        skillFilter === 'all'
                          ? 'bg-slate-950/20 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {planet.skillsData.reduce((acc, c) => acc + c.skills.length, 0)} items
                    </span>
                  </button>

                  <div className="border-t border-slate-800/80 my-1" />

                  {planet.skillsData.map((cat, idx) => {
                    const isSelected = skillFilter === cat.title;
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSkillFilter(cat.title);
                          setIsFilterDropdownOpen(false);
                          onPlaySelect();
                        }}
                        onMouseEnter={onPlayHover}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-sky-400/60'}`}
                          />
                          <span>{cat.title}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isSelected
                              ? 'bg-slate-950/20 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {cat.skills.length} items
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skills Grid */}
            <div className="space-y-3">
              {planet.skillsData
                .filter((cat) => skillFilter === 'all' || skillFilter === cat.title)
                .map((cat, cIdx) => (
                  <div key={cIdx} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                    <div className="text-[11px] font-mono font-semibold text-sky-400 uppercase tracking-wider mb-2">
                      {cat.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((skill, sIdx) => (
                        <div
                          key={sIdx}
                          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition hover:border-sky-400/50"
                        >
                          {skill.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 2. JOURNEY / TIMELINE PLANET */}
        {planet.id === 'experience' && planet.timelineData && (
          <div className="py-4 space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-amber-400 before:to-amber-500/10">
              {planet.timelineData.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-amber-400 group-hover:scale-125 transition" />
                  <div className="text-[10px] font-mono text-amber-400 font-semibold">{item.year}</div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{item.role}</h3>
                  <div className="text-xs text-slate-400">{item.institution}</div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 text-justify font-sans">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.badges.map((b, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. LAB & R&D (PROJECTS) PLANET */}
        {planet.id === 'building' && planet.projectsData && (
          <div className="py-4 space-y-3">
            {planet.projectsData.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                      {proj.type}
                    </span>
                    <h3 className="text-sm font-bold text-white">{proj.title}</h3>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono whitespace-nowrap ${
                      proj.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed text-justify font-sans">{proj.description}</p>

                {proj.features && (
                  <div className="space-y-1 bg-slate-950/40 p-2.5 rounded-xl text-[11px] text-slate-300 font-sans">
                    {proj.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5 text-justify">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.tech.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. COMMS / CONTACT PLANET */}
        {planet.id === 'contact' && planet.socialsData && (
          <div className="py-4 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed text-justify font-sans">
              Ready to initiate contact? Transmit via sub-space channels or connect on developer platforms:
            </p>

            <div className="space-y-2">
              {planet.socialsData.map((social, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition"
                >
                  <div>
                    <div className="text-[10px] font-mono text-rose-400 uppercase">{social.platform}</div>
                    <div className="text-xs font-semibold text-white">{social.handle}</div>
                  </div>

                  {social.type === 'copy' ? (
                    <button
                      type="button"
                      onClick={() => onCopyText(social.handle, social.platform)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 text-xs font-semibold rounded-xl border border-rose-500/30 transition cursor-pointer"
                    >
                      {copyStatus === social.platform ? 'Copied' : 'Copy'}
                    </button>
                  ) : (
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-xl transition flex items-center gap-1"
                    >
                      <span>Open</span>
                      <span className="font-mono text-[10px]">[Link]</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Direct Contact Action Box */}
            <div className="p-4 bg-gradient-to-br from-rose-950/30 to-slate-900/60 rounded-2xl border border-rose-500/30 text-center space-y-2">
              <div className="text-xs font-bold text-white">Direct Channel Open</div>
              <p className="text-[11px] text-slate-400">Available for freelance, projects & full-time roles</p>
              <button
                type="button"
                onClick={() => onCopyText('fazzaufa94raihan@gmail.com', 'Quick Email')}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{copyStatus === 'Quick Email' ? 'Email Copied' : 'Copy fazzaufa94raihan@gmail.com'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Fallback Content (if any other planet) */}
        {!['skills', 'experience', 'building', 'contact'].includes(planet.id) && planet.content && (
          <div className="py-4 space-y-2.5">
            {planet.content.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: planet.color }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Footer (Sticky / Fixed at bottom) */}
      <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/95 shrink-0 flex items-center justify-between text-xs z-10">
        <button
          type="button"
          onClick={onPrevPlanet}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
        >
          ← Prev Planet
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition cursor-pointer text-[11px]"
        >
          Orbit Free Roam (Esc)
        </button>
        <button
          type="button"
          onClick={onNextPlanet}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
        >
          Next Planet →
        </button>
      </div>
    </aside>
  );
};
