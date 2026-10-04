import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { api } from '../services/api';
import type { ExtremeEvent, TrackPoint } from '../types';
import { FORECAST_HOURS } from '../types';

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#0071e3', gep03: '#34c759',
  gep04: '#af52de', gep05: '#ff2d55',
};

const ALL_MEMBERS = ['gep01', 'gep02', 'gep03', 'gep04', 'gep05'];

interface EventExplorerProps {
  currentHour: number;
  onHourChange: (h: number) => void;
}

export default function EventExplorer({ onHourChange }: EventExplorerProps) {
  const [events, setEvents] = useState<ExtremeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ExtremeEvent | null>(null);
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [hourFilter, setHourFilter] = useState<number | null>(null);
  const [tracks, setTracks] = useState<TrackPoint[]>([]);

  // fetch all events on mount
  useEffect(() => {
    api.getEvents().then(setEvents).catch(console.error);
  }, []);

  // when a specific event is selected, load its member's track
  useEffect(() => {
    if (!selectedEvent) { setTracks([]); return; }
    api.getTracks(selectedEvent.member)
      .then(setTracks)
      .catch(console.error);
  }, [selectedEvent]);

  // apply filters
  const filtered = events.filter(e => {
    if (memberFilter && e.member !== memberFilter) return false;
    if (hourFilter !== null && e.forecast_hour !== hourFilter) return false;
    return true;
  });

  // number the events for display
  const numbered = filtered.map((evt, i) => ({ ...evt, displayNum: i + 1 }));

  // evolution chart for selected event
  const evolutionOption = selectedEvent && tracks.length > 0 ? (() => {
    const memberTrack = tracks.filter(t => t.member === selectedEvent.member);
    memberTrack.sort((a, b) => a.forecast_hour - b.forecast_hour);
    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 25, right: 15, bottom: 20, left: 40 },
      xAxis: {
        type: 'category',
        data: memberTrack.map(t => `T+${t.forecast_hour}`),
        axisLabel: { color: '#6e6e73', fontSize: 9 },
        axisLine: { lineStyle: { color: '#e5e5ea' } }
      },
      yAxis: {
        type: 'value', name: 'mm/24h',
        nameTextStyle: { color: '#aeaeb2', fontSize: 9 },
        splitLine: { lineStyle: { color: '#f0f0f2', type: 'dashed' } },
        axisLabel: { color: '#6e6e73', fontSize: 9 }
      },
      series: [
        {
          name: 'Peak',
          type: 'line', smooth: true,
          data: memberTrack.map(t => t.max_intensity),
          itemStyle: { color: MEMBER_COLORS[selectedEvent.member] || '#6e6e73' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: (MEMBER_COLORS[selectedEvent.member] || '#6e6e73') + '33' },
                { offset: 1, color: (MEMBER_COLORS[selectedEvent.member] || '#6e6e73') + '00' }
              ]
            }
          }
        },
        {
          name: 'Mean',
          type: 'line', smooth: true,
          data: memberTrack.map(t => t.mean_intensity),
          itemStyle: { color: '#aeaeb2' },
          lineStyle: { type: 'dashed', width: 1.5 }
        }
      ]
    };
  })() : null;

  return (
    <div className="flex h-full">
      {/* left: filters + event list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* filters row */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[#e5e5ea] shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#aeaeb2] uppercase mr-1 font-medium">Member:</span>
            <button
              onClick={() => setMemberFilter(null)}
              className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${!memberFilter ? 'bg-[#e8f4fd] border-[#0071e3]/30 text-[#0071e3]' : 'border-[#e5e5ea] text-[#aeaeb2] hover:text-[#6e6e73]'}`}
            >All</button>
            {ALL_MEMBERS.map(m => (
              <button
                key={m}
                onClick={() => setMemberFilter(memberFilter === m ? null : m)}
                className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${memberFilter === m ? 'bg-[#e8f4fd] border-[#0071e3]/30 text-[#0071e3]' : 'border-[#e5e5ea] text-[#aeaeb2] hover:text-[#6e6e73]'}`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-0.5" style={{ background: MEMBER_COLORS[m] }} />
                {m.slice(-2)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#aeaeb2] uppercase mr-1 font-medium">Hour:</span>
            <button
              onClick={() => setHourFilter(null)}
              className={`text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${hourFilter === null ? 'bg-[#e8f4fd] border-[#0071e3]/30 text-[#0071e3]' : 'border-[#e5e5ea] text-[#aeaeb2] hover:text-[#6e6e73]'}`}
            >All</button>
            {FORECAST_HOURS.map(h => (
              <button
                key={h}
                onClick={() => setHourFilter(hourFilter === h ? null : h)}
                className={`text-[9px] px-1 py-0.5 rounded-md border mono font-medium ${hourFilter === h ? 'bg-[#e8f4fd] border-[#0071e3]/30 text-[#0071e3]' : 'border-[#e5e5ea] text-[#aeaeb2] hover:text-[#6e6e73]'}`}
              >{h}</button>
            ))}
          </div>
          <div className="text-[9px] text-[#aeaeb2] ml-auto mono">{filtered.length} events</div>
        </div>

        {/* event cards */}
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {numbered.map(evt => {
              const isSelected = selectedEvent?.event_id === evt.event_id;
              return (
                <button
                  key={evt.event_id}
                  onClick={() => setSelectedEvent(isSelected ? null : evt)}
                  className={`text-left bg-[#f5f5f7] border rounded-xl p-2.5 transition-all ${
                    isSelected ? 'border-[#0071e3]/40 ring-1 ring-[#0071e3]/20 bg-white shadow-sm' : 'border-[#e5e5ea] hover:border-[#d1d1d6] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-[#aeaeb2] mono">#{String(evt.displayNum).padStart(3, '0')}</span>
                    <span className="text-[9px] mono font-medium" style={{ color: MEMBER_COLORS[evt.member] }}>{evt.member}</span>
                  </div>
                  <div className="text-xs mono text-[#1d1d1f] font-medium">{evt.max_intensity.toFixed(0)} mm</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-[#aeaeb2]">T+{evt.forecast_hour}</span>
                    <span className="text-[9px] text-[#aeaeb2]">{evt.area.toFixed(0)} cells</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* right: detail panel when event selected */}
      {selectedEvent && (
        <div className="w-64 border-l border-[#e5e5ea] bg-white flex flex-col overflow-y-auto shrink-0">
          <div className="p-3 border-b border-[#e5e5ea]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#aeaeb2] uppercase tracking-widest font-medium">Event Detail</div>
              <button onClick={() => setSelectedEvent(null)} className="text-[#aeaeb2] hover:text-[#1d1d1f] text-sm transition-colors">×</button>
            </div>
            <div className="text-sm mono text-[#1d1d1f] font-semibold mt-1">{selectedEvent.event_id}</div>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Member', value: selectedEvent.member, color: MEMBER_COLORS[selectedEvent.member] },
                { label: 'Forecast', value: `T+${selectedEvent.forecast_hour}` },
                { label: 'Peak', value: `${selectedEvent.max_intensity.toFixed(0)} mm` },
                { label: 'Mean', value: `${selectedEvent.mean_intensity.toFixed(0)} mm` },
                { label: 'Area', value: `${selectedEvent.area.toFixed(0)} cells` },
                { label: 'Location', value: `${selectedEvent.latitude_centroid.toFixed(1)}°N ${selectedEvent.longitude_centroid.toFixed(1)}°E` },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#f5f5f7] rounded-xl p-2 border border-[#e5e5ea]">
                  <div className="text-[9px] text-[#aeaeb2] uppercase">{label}</div>
                  <div className="text-[11px] text-[#1d1d1f] mono mt-0.5 font-medium" style={color ? { color } : undefined}>{value}</div>
                </div>
              ))}
            </div>

            {/* evolution across forecast hours */}
            {evolutionOption && (
              <div>
                <div className="text-[10px] text-[#6e6e73] uppercase tracking-widest mb-1 font-medium">
                  {selectedEvent.member} — Intensity Evolution
                </div>
                <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-1">
                  <ReactECharts option={evolutionOption} style={{ height: '120px', width: '100%' }} />
                </div>
              </div>
            )}

            <button
              onClick={() => { onHourChange(selectedEvent.forecast_hour); }}
              className="w-full text-[10px] py-2 rounded-xl border border-[#0071e3]/30 text-[#0071e3] hover:bg-[#e8f4fd] transition-colors uppercase tracking-widest font-medium"
            >
              Jump to T+{selectedEvent.forecast_hour} on map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
