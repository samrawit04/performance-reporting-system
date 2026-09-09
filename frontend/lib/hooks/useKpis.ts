'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { KpiDefinition, RatingThreshold, ScoringConfigMap } from '../types';
import { queryKeys } from './query-keys';

export function useKpiDefinitions(all = true, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kpis.definitions(),
    queryFn: () => api.get<KpiDefinition[]>(`/kpi/definitions${all ? '?all=true' : ''}`),
    enabled,
  });
}

export function useRatingThresholds(enabled = true) {
  return useQuery({
    queryKey: queryKeys.kpis.thresholds(),
    queryFn: () => api.get<RatingThreshold[]>('/kpi/config/rating-thresholds'),
    enabled,
  });
}

export function useScoringConfigs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.kpis.scoring(),
    queryFn: () => api.get<ScoringConfigMap>('/kpi/config/scoring'),
    enabled,
  });
}

export function useUpdateScoringConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value, is_confirmed = true }: { key: string; value: any; is_confirmed?: boolean }) =>
      api.put(`/kpi/config/scoring/${key}`, { value, is_confirmed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.scoring() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateRatingThresholds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (thresholds: RatingThreshold[]) =>
      api.put<RatingThreshold[]>('/kpi/config/rating-thresholds', thresholds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.thresholds() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useCreateKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<KpiDefinition>) =>
      api.post<KpiDefinition>('/kpi/definitions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.definitions() });
    },
  });
}

export function useUpdateKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KpiDefinition> }) =>
      api.patch<KpiDefinition>(`/kpi/definitions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.definitions() });
    },
  });
}

export function useToggleKpiActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<KpiDefinition>(`/kpi/definitions/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.definitions() });
    },
  });
}

export function useDeleteKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/kpi/definitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.definitions() });
    },
  });
}
