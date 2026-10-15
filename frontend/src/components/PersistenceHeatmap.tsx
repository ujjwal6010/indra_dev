import ReactECharts from 'echarts-for-react';
import type { TrackPoint, ScenarioPersistence } from '../types';

interface PersistenceHeatmapProps {
  scenario: ScenarioPersistence;
  trajectory: TrackPoint[];
}

export default function PersistenceHeatmap({ scenario, trajectory }: PersistenceHeatmapProps) {
  if (!trajectory || trajectory.length === 0) return null;

  const hours = Array.from(new Set(trajectory.map(t => t.forecast_hour))).sort((a, b) => a - b);
  const members = scenario.members;

  const data = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = 0; j < hours.length; j++) {
      const m = members[i];
      const h = hours[j];
      const pt = trajectory.find(t => t.member === m && t.forecast_hour === h);
      data.push([j, i, pt ? Number((pt.max_intensity ?? 0).toFixed(0)) : 0]);
    }
  }

  const option = {
    tooltip: {
      position: 'top',
      formatter: (p: any) => {
        const val = p.value[2];
        if (val === 0) return 'Not present';
        return `<div><b>${members[p.value[1]]}</b> @ T+${hours[p.value[0]]}</div>` +
               `<div>Peak: <b>${val} mm/24h</b></div>`;
      }
    },
    grid: { top: 30, right: 20, bottom: 20, left: 45 },
    xAxis: {
      type: 'category',
      data: hours.map(h => `T+${h}`),
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      splitArea: { show: true, areaStyle: { color: ['rgba(0,0,0,0.01)', 'rgba(0,0,0,0.03)'] } }
    },
    yAxis: {
      type: 'category',
      data: members,
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 200,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemWidth: 10,
      itemHeight: 100,
      textStyle: { color: '#6e6e73', fontSize: 10 },
      inRange: { color: ['#f5f5f7', '#5ac8fa', '#ff9f0a', '#ff3b30'] }
    },
    series: [{
      name: 'Persistence',
      type: 'heatmap',
      data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0, 0, 0, 0.15)' } }
    }]
  };

  return (
    <div className="mt-4 select-none">
      <div className="text-xs text-[#6e6e73] uppercase tracking-widest mb-2 font-medium">Member Persistence</div>
      <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
    </div>
  );
}