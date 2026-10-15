// ─── Core domain types ────────────────────────────────────────────────────────

export interface Member {
  id: string;
  label: string;
  color: string;
}

export const MEMBERS: Member[] = [
  { id: "gep01", label: "GEP 01", color: "#f97316" },
  { id: "gep02", label: "GEP 02", color: "#0071e3" },
  { id: "gep03", label: "GEP 03", color: "#34c759" },
  { id: "gep04", label: "GEP 04", color: "#af52de" },
  { id: "gep05", label: "GEP 05", color: "#ff2d55" },
];

export const FORECAST_HOURS = [24, 30, 36, 42, 48, 54, 60, 66, 72];
export const SCALES_KM = [50, 100, 150, 200];

// ─── API response types ───────────────────────────────────────────────────────

export interface TrackPoint {
  member: string;
  track_id: string;
  forecast_hour: number;
  latitude: number;
  longitude: number;
  area: number;
  max_intensity: number;
  mean_intensity: number;
}

export interface ExtremeEvent {
  event_id: string;
  member: string;
  forecast_hour: number;
  latitude_centroid: number;
  longitude_centroid: number;
  area: number;
  max_intensity: number;
  mean_intensity: number;
}

export interface ScenarioGroup {
  scenario_id: string;
  forecast_hour: number;
  members: string[];
  scale_km: number;
}

export interface ScenarioPersistence {
  scenario_id: string;
  members: string[];
  scale_km: number;
  first_hour: number;
  last_hour: number;
  timesteps: number;
  longest_consecutive: number;
  status: "Persistent" | "Emerging" | "Scale-sensitive" | "Transient" | string;
}

export interface ScenarioDetail extends ScenarioPersistence {
  trajectory?: TrackPoint[];
  atmosphere?: AtmosphericState;
}

export interface AtmosphericState {
  disclaimer: string;
  level: string;
  members: Record<string, {
    temperature_c: number | null;
    u_wind: number | null;
    v_wind: number | null;
    wind_speed: number | null;
    geopotential_height_500?: number | null;
    cape_surface?: number | null;
  }>;
}

export interface RobustnessCell {
  forecast_hour: number;
  scale_km: number;
  scenario_count: number;
  max_timesteps: number;
  has_persistent: boolean;
}

export interface ForecastState {
  forecast_hour: number;
  tracks: TrackPoint[];
  scenarios: ScenarioGroup[];
  events: ExtremeEvent[];
}

export interface Cycle {
  cycle_id: string;
  init_time: string;
  members: string[];
  forecast_hours: number[];
  total_events: number;
  total_tracks: number;
  total_scenarios: number;
}

// ─── UI state types ───────────────────────────────────────────────────────────

export type MapLayer = "precipitation" | "tracks" | "scenarios" | "atmosphere";

export interface AppState {
  selectedForecastHour: number;
  selectedScaleKm: number;
  selectedScenarioId: string | null;
  selectedMember: string | null;
  isPlaying: boolean;
  activeLayers: MapLayer[];
  activeTab: "map" | "events" | "scenarios" | "robustness" | "about";
}