'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from './query-keys';

export function usePendingReviews(enabled = true) {
  return useQuery({
    queryKey: queryKeys.reviews.pending(),
    queryFn: () => api.get<any[]>('/review/pending'),
    enabled,
  });
}

export function useReviewFeedback(submissionId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(submissionId),
    queryFn: () => api.get<any>(`/review/submissions/${submissionId}/feedback`),
    enabled: enabled && !!submissionId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: string; data: any }) =>
      api.post<any>(`/review/submissions/${submissionId}/feedback`, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(variables.submissionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
