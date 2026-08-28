/**
 * Role enum for the application.
 * Used by the auth guards and role-based access control.
 */
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  REVIEWER = 'REVIEWER',
}

/**
 * BSC Perspective enum.
 * The four Balanced Scorecard perspectives.
 */
export enum BscPerspective {
  FINANCIAL = 'FINANCIAL',
  CUSTOMER = 'CUSTOMER',
  INTERNAL_PROCESS = 'INTERNAL_PROCESS',
  LEARNING_GROWTH = 'LEARNING_GROWTH',
}

/**
 * Submission status enum.
 * Drives the workflow state machine.
 */
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CALCULATED = 'CALCULATED',
  AI_ANALYZED = 'AI_ANALYZED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  FINALIZED = 'FINALIZED',
}

/**
 * Period type enum.
 * Reporting period types.
 */
export enum PeriodType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

/**
 * Review action enum.
 */
export enum ReviewAction {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
}

/**
 * KPI direction enum.
 * Whether higher or lower actual values indicate better performance.
 */
export enum KpiDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
}

/**
 * File processing status enum.
 */
export enum FileProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
