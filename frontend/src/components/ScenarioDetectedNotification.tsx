import { useState, useEffect } from 'react';
import type { ScenarioPersistence } from '../types';

interface ScenarioDetectedNotificationProps {
  scenario: ScenarioPersistence | null;
  onDismiss: () => void;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#0071e3', gep03: '#34c759',
  gep04: '#af52de', gep05: '#ff2d55',
};

export default function ScenarioDetectedNotification({ scenario, onDismiss }: ScenarioDetectedNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (scenario) {
      setVisible(true);
      const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scenario, onDismiss]);

  if (!scenario || !visible) return null;

  return (
    <div className="absolute top-4 right-4 z-50 w-72 glass rounded-2xl border p-4 animate-fade-in-up select-none shadow-lg"
      style={{ borderColor: 'rgba(52,199,89,0.3)' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[10px] text-[#248a3d] uppercase tracking-widest font-semibold mb-0.5">
            🔍 Scenario Structure Detected
          </div>
          <div className="text-[#1d1d1f] font-bold mono text-sm">{scenario.scenario_id}</div>
        </div>
        <button onClick={() => { setVisible(false); onDismiss(); }}
          className="text-[#aeaeb2] hover:text-[#1d1d1f] text-lg leading-none transition-colors cursor-pointer p-1">×</button>
      </div>

      <div className="flex gap-1.5 mb-2">
        {scenario.members.map(m => (
          <div key={m} className="flex items-center gap-1 bg-[#f5f5f7] rounded-md px-1.5 py-0.5 border border-[#e5e5ea]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MEMBER_COLORS[m] }} />
            <span className="text-[10px] mono text-[#6e6e73]">{m}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-[#aeaeb2]">Persistence: </span>
          <span className="text-[#1d1d1f] mono font-medium">{scenario.timesteps} timesteps</span>
        </div>
        <div>
          <span className="text-[#aeaeb2]">Scale: </span>
          <span className="text-[#1d1d1f] mono font-medium">{scenario.scale_km} km</span>
        </div>
        <div>
          <span className="text-[#aeaeb2]">T+{scenario.first_hour} → T+{scenario.last_hour}</span>
        </div>
      </div>
    </div>
  );
}