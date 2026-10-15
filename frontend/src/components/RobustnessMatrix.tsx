import type { RobustnessCell } from '../types';
import { FORECAST_HOURS, SCALES_KM } from '../types';

interface RobustnessMatrixProps {
  matrix: RobustnessCell[];
  onCellClick: (hour: number, scale: number) => void;
  selectedHour: number;
  selectedScale: number;
}

function getCellColor(cell: RobustnessCell | undefined): string {
  if (!cell || cell.scenario_count === 0) return 'bg-[#f0f0f4]';
  if (cell.has_persistent) return 'bg-[#dcf5e3]';
  if (cell.max_timesteps >= 2) return 'bg-[#ffe8cc]';
  return 'bg-[#d6ebff]';
}

function getDotColor(cell: RobustnessCell | undefined): string {
  if (!cell || cell.scenario_count === 0) return 'bg-[#b0b0b8]';
  if (cell.has_persistent) return 'bg-[#34c759]';
  if (cell.max_timesteps >= 2) return 'bg-[#ff9f0a]';
  return 'bg-[#0071e3]';
}

export default function RobustnessMatrix({ matrix, onCellClick, selectedHour, selectedScale }: RobustnessMatrixProps) {
  const getCell = (fh: number, scale: number) =>
    matrix.find(c => c.forecast_hour === fh && c.scale_km === scale);

  return (
    <div className="p-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] text-[#1d2b45] uppercase tracking-widest font-bold">
            Scale Robustness Matrix
          </h3>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-[#4b5563]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#34c759]" /> Persistent</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff9f0a]" /> Emerging</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0071e3]" /> Transient</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="border border-[#e5e5ea] rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e5e5ea]">
                <th className="text-left font-medium text-[#6e6e73] py-2.5 px-4 border-r border-[#e5e5ea] w-32">Lead Time</th>
                {SCALES_KM.map(s => (
                  <th key={s} className="font-medium text-[#6e6e73] py-2.5 px-4 border-r border-[#e5e5ea] last:border-r-0 text-center">{s} km</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FORECAST_HOURS.map(fh => (
                <tr key={fh} className="border-b border-[#e5e5ea] last:border-b-0">
                  <td className="py-2.5 px-4 border-r border-[#e5e5ea] font-bold text-[#1d3a8f] bg-[#fcfcfd]">
                    T+{fh}
                  </td>
                  {SCALES_KM.map(scale => {
                    const cell = getCell(fh, scale);
                    const isSelected = fh === selectedHour && scale === selectedScale;
                    return (
                      <td 
                        key={scale} 
                        className="py-2 px-4 border-r border-[#e5e5ea] last:border-r-0 text-center bg-white hover:bg-[#f5f5f7] transition-colors cursor-pointer" 
                        onClick={() => onCellClick(fh, scale)}
                      >
                        <div
                          title={cell ? `${cell.scenario_count} scenarios, max ${cell.max_timesteps} steps` : 'No scenarios'}
                          className={`w-9 h-5 rounded-full ${getCellColor(cell)} ${isSelected ? 'ring-2 ring-offset-1 ring-[#0071e3]' : ''} flex items-center justify-center mx-auto`}
                        >
                          <div className={`w-2 h-2 rounded-full ${getDotColor(cell)}`} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}