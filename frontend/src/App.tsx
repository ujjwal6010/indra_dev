import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapView from './map/MapView';
import ForecastTimeline from './components/ForecastTimeline';
import ScenarioPanel from './components/ScenarioPanel';
import ScenarioDrawer from './components/ScenarioDrawer';
import RobustnessMatrix from './components/RobustnessMatrix';
import ScenarioDetectedNotification from './components/ScenarioDetectedNotification';
import EventExplorer from './components/EventExplorer';
import AboutPanel from './components/AboutPanel';
import { exportElementAsPng } from './utils/exportPng';
import { useForecastState, useScenarios, useScaleAnalysis, useCycles, useForecastReplay } from './hooks/useWeatherData';
import { SCALES_KM } from './types';
import type { ScenarioPersistence } from './types';

export default function App() {
  const [currentHour, setCurrentHour] = useState(24);
  const [scaleKm, setScaleKm] = useState(50);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [notification, setNotification] = useState<ScenarioPersistence | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showSpaghetti, setShowSpaghetti] = useState(false);
  const [bottomTab, setBottomTab] = useState<'robustness' | 'events'>('robustness');
  const [bottomHeight, setBottomHeight] = useState(208);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(208);
  const prevHour = useRef(currentHour);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { data: forecastState, loading: forecastLoading } = useForecastState(currentHour, scaleKm);
  const { scenarios } = useScenarios(scaleKm);
  const { matrix } = useScaleAnalysis();
  const { cycles } = useCycles();

  const handleHourChange = useCallback((h: number) => {
    prevHour.current = currentHour;
    setCurrentHour(h);
  }, [currentHour]);

  const { isPlaying, start, stop } = useForecastReplay(handleHourChange);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = bottomHeight;
  };

  // Drag handling for bottom panel
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY;
      const newHeight = dragStartHeight.current + deltaY;
      setBottomHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 250)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Trigger notification when a persistent scenario first appears
  useEffect(() => {
    if (!forecastState || !scenarios.length) return;
    const emerging = scenarios.find(s =>
      s.status === 'Persistent' &&
      s.first_hour === currentHour &&
      currentHour > prevHour.current
    );
    if (emerging) setNotification(emerging);
  }, [currentHour, forecastState, scenarios]);

  const activeScenarios = scenarios.filter(
    s => s.first_hour <= currentHour && currentHour <= s.last_hour
  );

  const cycle = cycles[0];

  return (
    <div ref={dashboardRef} className="flex flex-col h-screen bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden">
      {/* ── Header (Cloudflare Inspired) ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5ea] bg-white shrink-0 z-50 relative">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IndraDev Logo" className="w-7 h-7 rounded-[4px]" />
          <div className="text-base font-bold tracking-widest text-[#1d1d1f]">
            INDRADEV
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-2 h-full absolute left-1/2 -translate-x-1/2">

          <div className="h-full flex items-center px-2 cursor-pointer">
            <span className="text-[13px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] transition-colors">Dashboard</span>
          </div>

          {/* Views Dropdown */}
          <div className="h-full flex items-center px-2 cursor-pointer group"
            onMouseEnter={() => setActiveMenu('views')}
            onMouseLeave={() => setActiveMenu(null)}>
            <div className={`flex items-center gap-1.5 text-[13px] font-semibold transition-colors h-8 px-3 rounded-md ${activeMenu === 'views' ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}>
              Views
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${activeMenu === 'views' ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
            </div>

            {activeMenu === 'views' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[700px]">
                <div className="bg-white border border-[#e5e5ea] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-2 grid grid-cols-3 gap-2">

                  <div onClick={() => setShowSpaghetti(!showSpaghetti)} className="p-4 hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-pointer">
                    <div className="text-sm font-semibold text-[#1d1d1f] mb-1">Spaghetti Plot</div>
                    <div className="text-[12px] text-[#6e6e73] leading-relaxed">View all ensemble member tracks overlaid simultaneously</div>
                  </div>

                  <div onClick={() => setShowAbout(true)} className="p-4 hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-pointer">
                    <div className="text-sm font-semibold text-[#1d1d1f] mb-1">Methodology</div>
                    <div className="text-[12px] text-[#6e6e73] leading-relaxed">Learn about the persistent scenario detection system</div>
                  </div>

                  <div className="p-4 hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-pointer">
                    <div className="text-sm font-semibold text-[#1d1d1f] mb-1">Data Explorer</div>
                    <div className="text-[12px] text-[#6e6e73] leading-relaxed">Browse raw forecast data and atmospheric tracks</div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Metrics Dropdown */}
          <div className="h-full flex items-center px-2 cursor-pointer group"
            onMouseEnter={() => setActiveMenu('metrics')}
            onMouseLeave={() => setActiveMenu(null)}>
            <div className={`flex items-center gap-1.5 text-[13px] font-semibold transition-colors h-8 px-3 rounded-md ${activeMenu === 'metrics' ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}>
              Metrics
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${activeMenu === 'metrics' ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
            </div>

            {activeMenu === 'metrics' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[700px]">
                <div className="bg-white border border-[#e5e5ea] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-2 grid grid-cols-3 gap-2">

                  <div className="p-4 hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-default">
                    <div className="text-sm font-semibold text-[#1d1d1f] mb-1">Total Events</div>
                    <div className="text-[12px] text-[#6e6e73] mb-3 leading-relaxed">Detected extreme precipitation events</div>
                    <div className="text-2xl font-mono text-[#1d1d1f] font-semibold">{cycle?.total_events ?? '—'}</div>
                  </div>

                  <div className="p-4 hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-default">
                    <div className="text-sm font-semibold text-[#1d1d1f] mb-1">Tracked Systems</div>
                    <div className="text-[12px] text-[#6e6e73] mb-3 leading-relaxed">Spatially coherent tracks across time</div>
                    <div className="text-2xl font-mono text-[#1d1d1f] font-semibold">{cycle?.total_tracks ?? '—'}</div>
                  </div>

                  <div className="p-4 hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-default">
                    <div className="text-sm font-semibold text-[#1d1d1f] mb-1">Scenarios</div>
                    <div className="text-[12px] text-[#6e6e73] mb-3 leading-relaxed">Cross-member spatial agreement</div>
                    <div className="text-2xl font-mono text-[#248a3d] font-semibold">{scenarios.length}</div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[13px] text-[#ff3b30] font-semibold cursor-pointer hover:opacity-80">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Cycle {cycle ? `${cycle.init_time.slice(0, 10)}` : 'Loading'}
          </div>
          <button className="text-[13px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] transition-colors">
            Settings
          </button>
          <button
            onClick={() => dashboardRef.current && exportElementAsPng(dashboardRef.current, 'dashboard_screenshot')}
            className="text-[13px] font-semibold text-[#1d1d1f] border border-[#d1d1d6] hover:border-[#1d1d1f] rounded-full px-4 py-1.5 transition-colors">
            Export
          </button>
          <button className="text-[#1d1d1f] hover:text-[#0071e3] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="w-[320px] flex flex-col border-r border-[#e5e5ea] bg-[#f8f9fa] shrink-0 relative overflow-y-auto overflow-x-hidden">


          <div className="relative z-10 flex flex-col divide-y divide-[#e5e5ea]/60">
            {/* STUDY REGION */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d2b45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l6-3 6 3 6-3v12l-6 3-6-3-6 3V6z" /><line x1="9" y1="3" x2="9" y2="15" /><line x1="15" y1="9" x2="15" y2="21" /></svg>
                <h3 className="text-[12px] font-bold text-[#1d2b45] uppercase tracking-wider">Study Region</h3>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e5e5ea]">
                <div className="flex items-center justify-between mb-3 cursor-pointer group">
                  <span className="text-[13px] font-semibold text-[#4b5563]">5°N - 38°N 65°E - 100°E</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#1d2b45] transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-center gap-1 w-1/3 text-center">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="#d6ebff" stroke="#0071e3" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                     <span className="text-[10px] text-[#6e6e73] leading-tight font-medium mt-1">India & Surrounding Region</span>
                   </div>
                   <div className="w-2/3 h-16 bg-[#e8f4fd] rounded-lg border border-[#0071e3]/20 relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-2 border border-dashed border-[#0071e3]/60 rounded z-10 pointer-events-none" />
                     <img src="/india-map.png?v=2" alt="India Map" className="absolute inset-0 w-full h-full object-contain p-2.5 opacity-90" />
                   </div>
                </div>
              </div>
            </div>

            {/* SPATIAL SCALE */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d2b45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  <h3 className="text-[12px] font-bold text-[#1d2b45] uppercase tracking-wider">Spatial Scale <span className="text-[#9ca3af] font-medium lowercase">(km)</span></h3>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div className="flex gap-2">
                {SCALES_KM.map(s => (
                  <button
                    key={s}
                    onClick={() => setScaleKm(s)}
                    className={`flex-1 py-1.5 rounded-lg border transition-all font-semibold text-[13px] ${s === scaleKm
                        ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-sm'
                        : 'bg-white border-[#e5e5ea] text-[#4b5563] hover:border-[#d1d1d6] hover:text-[#1d1d1f] shadow-sm'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* THRESHOLD */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d2b45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <h3 className="text-[12px] font-bold text-[#1d2b45] uppercase tracking-wider">Threshold</h3>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 cursor-pointer hover:stroke-[#6e6e73] transition-colors"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-[#6e6e73] transition-colors"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div className="bg-white border border-[#e5e5ea] rounded-xl px-4 py-3 text-[13px] font-semibold text-[#1d2b45] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#d1d1d6] hover:shadow-md transition-all group">
                95th percentile
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#1d2b45] transition-colors"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            {/* MEMBERS */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d2b45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <h3 className="text-[12px] font-bold text-[#1d2b45] uppercase tracking-wider">Members</h3>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 cursor-pointer hover:stroke-[#6e6e73] transition-colors"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-[#e5e5ea] p-4">
                <div className="grid grid-cols-2 gap-y-3 mb-4">
                  {['GEP 01', 'GEP 02', 'GEP 03', 'GEP 04', 'GEP 05'].map((m, i) => {
                    const colors = ['#f97316', '#0071e3', '#34c759', '#af52de', '#ff2d55'];
                    return (
                      <div key={m} className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="w-[18px] h-[18px] rounded-[5px] border border-transparent flex items-center justify-center transition-opacity hover:opacity-80 shadow-sm" style={{ backgroundColor: colors[i] }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span className="text-[13px] font-medium text-[#4b5563] group-hover:text-[#1d2b45] transition-colors">{m}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-[#e5e5ea] flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer group">
                     <div className="w-[18px] h-[18px] rounded-[5px] border border-[#d1d1d6] bg-white flex items-center justify-center group-hover:border-[#9ca3af] transition-colors" />
                     <span className="text-[13px] font-medium text-[#4b5563] group-hover:text-[#1d2b45] transition-colors">Select all</span>
                  </div>
                  <button className="text-[13px] font-bold text-[#0071e3] hover:text-[#005bb5] transition-colors pr-1">
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Scenario list */}
            <div className="p-4 flex-1">
              <ScenarioPanel
                scenarios={scenarios}
                selectedId={selectedScenarioId}
                currentHour={currentHour}
                onSelect={id => setSelectedScenarioId(prev => prev === id ? null : id)}
              />
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <MapView
              forecastState={forecastState}
              scenarios={activeScenarios}
              selectedScenarioId={selectedScenarioId}
              onScenarioClick={setSelectedScenarioId}
              showSpaghetti={showSpaghetti}
            />

            <AnimatePresence>
              {forecastLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-white/40 pointer-events-none"
                >
                  <div className="glass rounded-xl px-5 py-2.5 text-sm text-[#6e6e73] animate-subtle-glow font-medium">
                    Loading T+{currentHour}...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scenario detected notification */}
            <ScenarioDetectedNotification
              scenario={notification}
              onDismiss={() => setNotification(null)}
            />

            {/* About panel */}
            <AnimatePresence>
              {showAbout && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <AboutPanel onClose={() => setShowAbout(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Resizable Drag Handle ── */}
          <div
            className="h-1.5 -mt-1.5 w-full cursor-row-resize relative z-20 transition-colors hover:bg-[#0071e3]/30 flex items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
            <div className="w-12 h-1 bg-black/10 rounded-full group-hover:bg-[#0071e3]/50 transition-colors" />
          </div>

          {/* ── Bottom: Robustness Matrix / Events ── */}
          <div
            className="border-t border-[#e5e5ea] bg-white flex flex-col shrink-0"
            style={{ height: `${bottomHeight}px` }}
          >
            <div className="flex border-b border-[#e5e5ea]">
              {(['robustness', 'events'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`px-4 py-2.5 text-[11px] uppercase tracking-widest font-medium transition-colors ${bottomTab === tab ? 'tab-active text-[#1d1d1f]' : 'text-[#aeaeb2] hover:text-[#6e6e73]'
                    }`}
                >
                  {tab === 'robustness' ? 'Scale Robustness' : 'Events'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              {bottomTab === 'robustness' ? (
                <RobustnessMatrix
                  matrix={matrix}
                  onCellClick={(h, s) => { setCurrentHour(h); setScaleKm(s); }}
                  selectedHour={currentHour}
                  selectedScale={scaleKm}
                />
              ) : (
                <EventExplorer currentHour={currentHour} onHourChange={handleHourChange} />
              )}
            </div>
          </div>
        </div>

        {/* ── Right drawer ── */}
        <AnimatePresence>
          {selectedScenarioId && (
            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full"
            >
              <ScenarioDrawer
                scenarioId={selectedScenarioId}
                onClose={() => setSelectedScenarioId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ForecastTimeline
        currentHour={currentHour}
        isPlaying={isPlaying}
        scenarios={scenarios}
        onHourChange={handleHourChange}
        onPlay={() => start(currentHour)}
        onStop={stop}
      />
    </div>
  );
}
