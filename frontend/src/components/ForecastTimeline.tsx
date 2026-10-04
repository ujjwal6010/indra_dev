import { FORECAST_HOURS } from '../types';
import type { ScenarioPersistence } from '../types';

interface TimelineProps {
  currentHour: number;
  isPlaying: boolean;
  scenarios: ScenarioPersistence[];
  onHourChange: (h: number) => void;
  onPlay: () => void;
  onStop: () => void;
}


export default function ForecastTimeline({ currentHour, isPlaying, scenarios, onHourChange, onPlay, onStop }: TimelineProps) {
  const hourIndex = FORECAST_HOURS.indexOf(currentHour);

  const hasPersistentAt = (fh: number) =>
    scenarios.some(s => s.status === 'Persistent' && s.first_hour <= fh && fh <= s.last_hour);

  const hasScenarioAt = (fh: number) =>
    scenarios.some(s => s.first_hour <= fh && fh <= s.last_hour);

  return (
    <div className="flex items-center gap-4 px-5 py-3 border-t border-[#e5e5ea] bg-white">
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
        style={{
          background: isPlaying ? 'rgba(255,59,48,0.08)' : 'rgba(0,113,227,0.08)',
          border: `1px solid ${isPlaying ? 'rgba(255,59,48,0.2)' : 'rgba(0,113,227,0.2)'}`,
          color: isPlaying ? '#ff3b30' : '#0071e3',
        }}
      >
        {isPlaying ? (
          <><span>■</span> Stop</>
        ) : (
          <><span>▶</span> Play Forecast</>
        )}
      </button>

      {/* Timeline ticks */}
      <div className="flex-1 relative">
        <div className="flex justify-between mb-1.5">
          {FORECAST_HOURS.map(fh => (
            <div key={fh} className="flex flex-col items-center gap-0.5" style={{ width: `${100 / FORECAST_HOURS.length}%` }}>
              {hasPersistentAt(fh) ? (
                <div className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" title="Persistent scenario active" />
              ) : hasScenarioAt(fh) ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff9f0a] opacity-60" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-[#e5e5ea]" />
              )}
            </div>
          ))}
        </div>

        <input
          type="range"
          className="timeline-slider"
          min={0}
          max={FORECAST_HOURS.length - 1}
          value={hourIndex >= 0 ? hourIndex : 0}
          onChange={e => onHourChange(FORECAST_HOURS[Number(e.target.value)])}
        />

        <div className="flex justify-between mt-1">
          {FORECAST_HOURS.map((fh) => (
            <button
              key={fh}
              onClick={() => onHourChange(fh)}
              className={`text-[10px] mono transition-colors ${fh === currentHour ? 'text-[#0071e3] font-semibold' : 'text-[#aeaeb2] hover:text-[#6e6e73]'}`}
              style={{ width: `${100 / FORECAST_HOURS.length}%`, textAlign: 'center' }}
            >
              T+{fh}
            </button>
          ))}
        </div>
      </div>

      {/* Current hour display */}
      <div className="text-right min-w-[70px]">
        <div className="text-[10px] text-[#aeaeb2] uppercase tracking-widest">Lead Time</div>
        <div className="text-xl font-bold mono text-[#1d1d1f]">T+{currentHour}</div>
      </div>
    </div>
  );
}
