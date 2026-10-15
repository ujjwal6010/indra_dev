import ReactECharts from 'echarts-for-react';
import type { TrackPoint } from '../types';

interface IntensityChartProps {
  trajectory: TrackPoint[];
}

export default function IntensityChart({ trajectory }: IntensityChartProps) {
  if (!trajectory || trajectory.length === 0) return null;

  // Aggregate and sort by unique forecast hours to prevent duplicate/scrambled x-axis labels
  const uniqueHours = Array.from(new Set(trajectory.map(t => t.forecast_hour))).sort((a, b) => a - b);

  const maxIntensities = uniqueHours.map(fh => {
    const pointsAtHour = trajectory.filter(t => t.forecast_hour === fh);
    const maxVal = Math.max(...pointsAtHour.map(p => p.max_intensity ?? 0));
    return Number(maxVal.toFixed(1));
  });

  const meanIntensities = uniqueHours.map(fh => {
    const pointsAtHour = trajectory.filter(t => t.forecast_hour === fh);
    const avgVal = pointsAtHour.reduce((sum, p) => sum + (p.mean_intensity ?? 0), 0) / (pointsAtHour.length || 1);
    return Number(avgVal.toFixed(1));
  });

  const option = {
    tooltip: { 
      trigger: 'axis',
      formatter: (params: any[]) => {
        if (!params || !params.length) return '';
        let res = `<div className="font-semibold mb-1">${params[0].name}</div>`;
        params.forEach(p => {
          res += `<div style="color: ${p.color}">● ${p.seriesName}: <b>${p.value} mm/24h</b></div>`;
        });
        return res;
      }
    },
    grid: { top: 30, right: 20, bottom: 25, left: 45 },
    xAxis: {
      type: 'category',
      data: uniqueHours.map(h => `T+${h}`),
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e5e5ea' } }
    },
    yAxis: {
      type: 'value',
      name: 'mm/24h',
      nameTextStyle: { color: '#aeaeb2', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f0f2', type: 'dashed' } },
      axisLabel: { color: '#6e6e73', fontSize: 10 }
    },
    series: [
      {
        name: 'Peak Intensity',
        type: 'line',
        data: maxIntensities,
        smooth: true,
        itemStyle: { color: '#ff9f0a' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(255, 159, 10, 0.2)' }, { offset: 1, color: 'rgba(255, 159, 10, 0)' }]
          }
        }
      },
      {
        name: 'Mean Intensity',
        type: 'line',
        data: meanIntensities,
        smooth: true,
        itemStyle: { color: '#0071e3' },
        lineStyle: { width: 2 }
      }
    ]
  };

  return (
    <div className="mt-4 select-none">
      <div className="text-xs text-[#6e6e73] uppercase tracking-widest mb-2 font-medium">Intensity Evolution</div>
      <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
    </div>
  );
}