'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { KpiDefinition, RatingThreshold, ScoringConfigMap } from '../types';
import { queryKeys } from './query-keys';

export function useKpiDefinitions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.kpis.definitions(),
    queryFn: () => api.get<KpiDefinition[]>('/kpi/definitions'),
    enabled,
  });
}

export function useRatingThresholds(enabled = true) {
  return useQuery({
    queryKey: queryKeys.kpis.thresholds(),
    queryFn: () => api.get<RatingThreshold[]>('/kpi/thresholds'),
    enabled,
  });
}

export function useScoringConfigs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.kpis.scoring(),
    queryFn: () => api.get<ScoringConfigMap>('/kpi/scoring'),
    enabled,
  });
}

