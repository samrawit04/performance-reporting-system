'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './query-keys';

export function useManagerDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.manager(),
    queryFn: () => api.get<any>('/dashboard/manager'),
    enabled,
  });
}

export function useReviewerDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.reviewer(),
    queryFn: () => api.get<any>('/dashboard/reviewer'),
    enabled,
  });
}

export function useAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.admin(),
    queryFn: () => api.get<any>('/dashboard/admin'),
    enabled,
  });
}

export function useAggregationMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.aggregationMe(),
    queryFn: () => api.get<any>('/aggregation/me'),
    enabled,
  });
}

export function useAggregationOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.aggregationOverview(),
    queryFn: () => api.get<any>('/aggregation/overview'),
    enabled,
  });
}

export function useComplianceOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.compliance(),
    queryFn: () => api.get<any>('/aggregation/compliance'),
    enabled,
  });
}
