/**
 * Shared TypeScript interfaces matching the backend entities and API responses.
 */

/** User roles */
export type UserRole = 'ADMIN' | 'MANAGER' | 'REVIEWER';

/** BSC Perspective enum */
export type BscPerspective =
  | 'FINANCIAL'
  | 'CUSTOMER'
  | 'INTERNAL_PROCESS'
  | 'LEARNING_GROWTH';

/** Submission status */
export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CALCULATED'
  | 'AI_ANALYZED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'FINALIZED';

/** Period type */
export type PeriodType = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

/** Review action */
export type ReviewAction = 'PENDING' | 'APPROVED' | 'RETURNED';

/** KPI direction */
export type KpiDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';

/** User model */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Login response from API */
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    department?: string;
  };
}

/** KPI Definition */
export interface KpiDefinition {
  id: string;
  perspective: BscPerspective;
  objective: string;
  measurement: string;
  unit: string;
  description?: string;
  direction: KpiDirection;
  weight: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Rating Threshold */
export interface RatingThreshold {
  id?: string;
  label: string;
  min_score: number;
  max_score: number;
  sort_order: number;
  is_confirmed: boolean;
}

/** Scoring Config */
export interface ScoringConfigItem {
  value: any;
  description?: string;
  is_confirmed: boolean;
  updated_at?: string;
}

export type ScoringConfigMap = Record<string, ScoringConfigItem>;

/** Performance Entry (all 7 fields + calculated) */
export interface PerformanceEntry {
  id?: string;
  submission_id?: string;
  kpi_definition_id?: string;
  perspective: BscPerspective;
  objective: string;
  deliverable?: string;
  measurement: string;
  unit: string;
  weight?: number;
  plan_value: number;
  actual_value: number;
  notes?: string;
  achievement_pct?: number;
  score?: number;
  rating?: string;
  created_at?: string;
}

/** BSC Perspective Score */
export interface BSCPerspectiveScore {
  id?: string;
  submission_id?: string;
  perspective: BscPerspective;
  average_score: number;
  rating: string;
}

/** AI Analysis Model */
export interface AiAnalysis {
  id: string;
  submission_id: string;
  executive_summary: string;
  strengths: string[];
  improvement_areas: string[];
  perspective_analysis: {
    FINANCIAL?: string;
    CUSTOMER?: string;
    INTERNAL_PROCESS?: string;
    LEARNING_GROWTH?: string;
  };
  recommendations: string[];
  model_used: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
  updated_at: string;
}

/** Review Feedback Model */
export interface ReviewFeedback {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer?: User;
  action: ReviewAction;
  overall_feedback: string;
  perspective_feedback: {
    FINANCIAL?: string;
    CUSTOMER?: string;
    INTERNAL_PROCESS?: string;
    LEARNING_GROWTH?: string;
  };
  recommended_focus_areas: string[];
  created_at: string;
  updated_at: string;
}

/** Performance Submission */
export interface PerformanceSubmission {
  id: string;
  executive_id: string;
  executive?: User;
  submitted_by: string;
  submitter?: User;
  period_type: PeriodType;
  period_start?: string;
  period_end?: string;
  period_label: string;
  status: SubmissionStatus;
  overall_score?: number;
  overall_rating?: string;
  source_file_id?: string;
  entries: PerformanceEntry[];
  perspective_scores: BSCPerspectiveScore[];
  ai_analysis?: AiAnalysis;
  review_feedback?: ReviewFeedback;
  created_at: string;
  updated_at: string;
}

/** Parsed Excel result from API */
export interface ParsedPerformanceData {
  entries: {
    perspective: BscPerspective;
    objective: string;
    measurement: string;
    unit: string;
    plan_value: number;
    actual_value: number;
    notes?: string;
    raw_row?: number;
  }[];
  warnings: string[];
  errors: string[];
  totalRows: number;
  validRows: number;
}
