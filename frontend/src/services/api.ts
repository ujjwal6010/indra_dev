import type {
  Cycle, ForecastState, ScenarioPersistence, ScenarioDetail,
  RobustnessCell, ExtremeEvent, TrackPoint
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  getCycles: () => fetchJson<Cycle[]>('/cycles'),

  getForecastState: (hour: number, scaleKm: number = 50) =>
    fetchJson<ForecastState>(`/forecast/${hour}?scale_km=${scaleKm}`),

  getEvents: (forecastHour?: number, member?: string) => {
    const params = new URLSearchParams();
    if (forecastHour != null) params.set('forecast_hour', String(forecastHour));
    if (member) params.set('member', member);
    return fetchJson<ExtremeEvent[]>(`/events?${params}`);
  },

  getTracks: (member?: string, forecastHour?: number) => {
    const params = new URLSearchParams();
    if (member) params.set('member', member);
    if (forecastHour != null) params.set('forecast_hour', String(forecastHour));
    return fetchJson<TrackPoint[]>(`/tracks?${params}`);
  },

  getScenarios: (scaleKm?: number, minTimesteps?: number) => {
    const params = new URLSearchParams();
    if (scaleKm != null) params.set('scale_km', String(scaleKm));
    if (minTimesteps != null) params.set('min_timesteps', String(minTimesteps));
    return fetchJson<ScenarioPersistence[]>(`/scenarios?${params}`);
  },

  getScenarioDetail: (scenarioId: string) =>
    fetchJson<ScenarioDetail>(`/scenarios/${scenarioId}`),

  getScenarioTrajectory: (scenarioId: string) =>
    fetchJson<TrackPoint[]>(`/scenarios/${scenarioId}/trajectory`),

  getScenarioAtmosphere: (scenarioId: string) =>
    fetchJson(`/scenarios/${scenarioId}/atmosphere`),

  getScaleAnalysis: (scaleKm?: number) => {
    const params = scaleKm != null ? `?scale_km=${scaleKm}` : '';
    return fetchJson<RobustnessCell[]>(`/scale-analysis${params}`);
  },
};
