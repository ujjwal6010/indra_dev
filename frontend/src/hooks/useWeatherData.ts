import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { FORECAST_HOURS } from '../types';
import type { ForecastState, ScenarioPersistence, RobustnessCell, Cycle } from '../types';

export function useForecastState(hour: number, scaleKm: number) {
  const [data, setData] = useState<ForecastState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.getForecastState(hour, scaleKm)
      .then(res => {
        if (active) setData(res);
      })
      .catch(e => {
        if (active) setError(e.message || 'Failed to fetch forecast state');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hour, scaleKm]);

  return { data, loading, error };
}

export function useScenarios(scaleKm: number) {
  const [scenarios, setScenarios] = useState<ScenarioPersistence[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api.getScenarios(scaleKm)
      .then(res => {
        if (active) setScenarios(res);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scaleKm]);

  return { scenarios, loading };
}

export function useScaleAnalysis() {
  const [matrix, setMatrix] = useState<RobustnessCell[]>([]);

  useEffect(() => {
    let active = true;

    api.getScaleAnalysis()
      .then(res => {
        if (active) setMatrix(res);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  return { matrix };
}

export function useCycles() {
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    let active = true;

    api.getCycles()
      .then(res => {
        if (active) setCycles(res);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  return { cycles };
}

export function useForecastReplay(onHourChange: (h: number) => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourIndexRef = useRef(0);
  const onHourChangeRef = useRef(onHourChange);

  // Keep callback ref updated to prevent stale closures inside interval
  useEffect(() => {
    onHourChangeRef.current = onHourChange;
  }, [onHourChange]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((startHour: number) => {
    hourIndexRef.current = FORECAST_HOURS.indexOf(startHour);
    if (hourIndexRef.current < 0 || hourIndexRef.current >= FORECAST_HOURS.length - 1) {
      hourIndexRef.current = 0;
    }
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        hourIndexRef.current += 1;
        if (hourIndexRef.current >= FORECAST_HOURS.length) {
          stop();
          return;
        }
        onHourChangeRef.current(FORECAST_HOURS[hourIndexRef.current]);
      }, 1200);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, stop]);

  return { isPlaying, start, stop };
}