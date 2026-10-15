import type {
  Cycle, ForecastState, ScenarioPersistence, ScenarioDetail,
  RobustnessCell, ExtremeEvent, TrackPoint
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { signal });
  if (!res.ok) {
    let errorMsg = `API error ${res.status}: ${path}`;
    try {
      const errBody = await res.json();
      if (errBody.detail) errorMsg = errBody.detail;
    } catch {
      // Fallback to HTTP status error text if response is not JSON
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

function buildQuery(paramsRecord: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  Object.entries(paramsRecord).forEach(([key, val]) => {
    if (val != null && val !== '') {
      params.set(key, String(val));
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const api = {
  getCycles: (signal?: AbortSignal) => 
    fetchJson<Cycle[]>('/cycles', signal),

  getForecastState: (hour: number, scaleKm: number = 50, signal?: AbortSignal) =>
    fetchJson<ForecastState>(`/forecast/${hour}${buildQuery({ scale_km: scaleKm })}`, signal),

  getEvents: (forecastHour?: number, member?: string, signal?: AbortSignal) => {
    const query = buildQuery({ forecast_hour: forecastHour, member });
    return fetchJson<ExtremeEvent[]>(`/events${query}`, signal);
  },

  getTracks: (member?: string, forecastHour?: number, signal?: AbortSignal) => {
    const query = buildQuery({ member, forecast_hour: forecastHour });
    return fetchJson<TrackPoint[]>(`/tracks${query}`, signal);
  },

  getScenarios: (scaleKm?: number, minTimesteps?: number, signal?: AbortSignal) => {
    const query = buildQuery({ scale_km: scaleKm, min_timesteps: minTimesteps });
    return fetchJson<ScenarioPersistence[]>(`/scenarios${query}`, signal);
  },

  getScenarioDetail: (scenarioId: string, signal?: AbortSignal) =>
    fetchJson<ScenarioDetail>(`/scenarios/${scenarioId}`, signal),

  getScenarioTrajectory: (scenarioId: string, signal?: AbortSignal) =>
    fetchJson<TrackPoint[]>(`/scenarios/${scenarioId}/trajectory`, signal),

  getScenarioAtmosphere: (scenarioId: string, signal?: AbortSignal) =>
    fetchJson<any>(`/scenarios/${scenarioId}/atmosphere`, signal),

  getScaleAnalysis: (scaleKm?: number, signal?: AbortSignal) => {
    const query = buildQuery({ scale_km: scaleKm });
    return fetchJson<RobustnessCell[]>(`/scale-analysis${query}`, signal);
  },
};