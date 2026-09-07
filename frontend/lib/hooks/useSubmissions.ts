'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { PerformanceSubmission } from '../types';
import { queryKeys } from './query-keys';

export function useSubmissions(filters?: Record<string, any>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.submissions.list(filters),
    queryFn: () => {
      const searchParams = filters
        ? '?' + new URLSearchParams(Object.entries(filters).filter(([_, v]) => v != null) as [string, string][]).toString()
        : '';
      return api.get<PerformanceSubmission[]>(`/performance/submissions${searchParams}`);
    },
    enabled,
  });
}

export function useSubmission(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.submissions.detail(id),
    queryFn: () => api.get<PerformanceSubmission>(`/performance/submissions/${id}`),
    enabled: enabled && !!id,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.post<PerformanceSubmission>('/performance/submissions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch<PerformanceSubmission>(`/performance/submissions/${id}`, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<PerformanceSubmission>(`/performance/submissions/${id}/submit`),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/performance/submissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
