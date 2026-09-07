/**
 * Centralized Query Keys factory for TanStack Query.
 * Provides consistent hierarchical keys for caching and precise invalidation.
 */
export const queryKeys = {
  // Submissions
  submissions: {
    all: ['submissions'] as const,
    lists: () => [...queryKeys.submissions.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.submissions.lists(), { filters }] as const,
    details: () => [...queryKeys.submissions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.submissions.details(), id] as const,
  },

  // Dashboard & Metrics
  dashboard: {
    all: ['dashboard'] as const,
    manager: () => [...queryKeys.dashboard.all, 'manager'] as const,
    reviewer: () => [...queryKeys.dashboard.all, 'reviewer'] as const,
    admin: () => [...queryKeys.dashboard.all, 'admin'] as const,
    aggregationMe: () => [...queryKeys.dashboard.all, 'aggregation-me'] as const,
    aggregationOverview: () => [...queryKeys.dashboard.all, 'aggregation-overview'] as const,
    compliance: () => [...queryKeys.dashboard.all, 'compliance'] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    pending: () => [...queryKeys.reviews.all, 'pending'] as const,
    detail: (submissionId: string) => [...queryKeys.reviews.all, 'detail', submissionId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.users.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },

  // Audit Logs
  audit: {
    all: ['audit'] as const,
    list: (params?: Record<string, any>) => [...queryKeys.audit.all, 'list', params] as const,
  },

  // KPIs & Configurations
  kpis: {
    all: ['kpis'] as const,
    definitions: () => [...queryKeys.kpis.all, 'definitions'] as const,
    thresholds: () => [...queryKeys.kpis.all, 'thresholds'] as const,
    scoring: () => [...queryKeys.kpis.all, 'scoring'] as const,
  },
};
