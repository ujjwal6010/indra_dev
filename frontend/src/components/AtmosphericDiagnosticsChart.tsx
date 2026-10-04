import ReactECharts from 'echarts-for-react';

interface AtmosphericDiagnosticsChartProps {
  atmosphere: any;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#0071e3', gep03: '#34c759',
  gep04: '#af52de', gep05: '#ff2d55',
};

export default function AtmosphericDiagnosticsChart({ atmosphere }: AtmosphericDiagnosticsChartProps) {
  if (!atmosphere || !atmosphere.members) return null;

  const members = Object.keys(atmosphere.members);
  const temps = members.map(m => atmosphere.members[m].temperature_c);
  const winds = members.map(m => atmosphere.members[m].wind_speed);
  const capes = members.map(m => atmosphere.members[m].cape_surface);
  const heights = members.map(m => atmosphere.members[m].geopotential_height_500);

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 30, right: 20, bottom: 20, left: 40 },
    legend: { textStyle: { color: '#6e6e73', fontSize: 10 }, itemWidth: 10, itemHeight: 10, top: 0 },
    xAxis: {
      type: 'category',
      data: members,
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e5e5ea' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        nameTextStyle: { color: '#aeaeb2', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f0f0f2', type: 'dashed' } },
        axisLabel: { color: '#6e6e73', fontSize: 10 }
      },
      {
        type: 'value',
        name: 'm/s',
        nameTextStyle: { color: '#aeaeb2', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#6e6e73', fontSize: 10 }
      }
    ],
    series: [
      {
        name: 'Temperature',
        type: 'bar',
        data: temps.map((t) => ({ value: t, itemStyle: { color: MEMBER_COLORS[members[0]] || '#0071e3' } })),
        yAxisIndex: 0,
        barBorderRadius: [4, 4, 0, 0],
      },
      {
        name: 'Wind Speed',
        type: 'bar',
        data: winds.map((w) => ({ value: w, itemStyle: { color: 'rgba(174, 174, 178, 0.3)' } })),
        yAxisIndex: 1,
        barBorderRadius: [4, 4, 0, 0],
      }
    ]
  };

  const tempsArr = temps.filter(t => t != null);
  const avgTemp = tempsArr.length ? (tempsArr.reduce((a, b) => a + b, 0) / tempsArr.length).toFixed(1) : '--';
  
  const capesArr = capes.filter(c => c != null);
  const avgCape = capesArr.length ? Math.round(capesArr.reduce((a, b) => a + b, 0) / capesArr.length) : '--';
  
  const heightsArr = heights.filter(h => h != null);
  const avgHeight = heightsArr.length ? Math.round(heightsArr.reduce((a, b) => a + b, 0) / heightsArr.length) : '--';

  return (
    <div className="mt-4">
      <div className="text-xs text-[#6e6e73] uppercase tracking-widest mb-1 font-medium">850 hPa Atmospheric State</div>
      <div className="text-[10px] text-[#aeaeb2] mb-2 italic">{atmosphere.disclaimer}</div>
      <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
      {tempsArr.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="p-2.5 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea]">
            <div className="text-[10px] text-[#aeaeb2] uppercase">Avg Temp</div>
            <div className="text-sm text-[#1d1d1f] mono font-medium mt-0.5">{avgTemp}°C</div>
          </div>
          <div className="p-2.5 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea]">
            <div className="text-[10px] text-[#aeaeb2] uppercase">500hPa Height</div>
            <div className="text-sm text-[#1d1d1f] mono font-medium mt-0.5">{avgHeight} m</div>
          </div>
          <div className="p-2.5 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea]">
            <div className="text-[10px] text-[#aeaeb2] uppercase">Avg CAPE</div>
            <div className="text-sm text-[#1d1d1f] mono font-medium mt-0.5">{avgCape} J/kg</div>
          </div>
        </div>
      )}
    </div>
  );
}
