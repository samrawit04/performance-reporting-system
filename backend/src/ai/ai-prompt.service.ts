import { Injectable } from '@nestjs/common';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';

@Injectable()
export class AiPromptService {
  buildSystemPrompt(): string {
    return `You are an elite Executive Performance Management Advisor and Balanced Scorecard (BSC) expert.
Your task is to provide a comprehensive, objective, and professional performance evaluation for an executive report.

Analyze the performance data strictly based on the provided numbers, achievement rates, and notes.

You MUST reply with ONLY a valid, parseable JSON object matching this exact schema:
{
  "executive_summary": "A 2-3 paragraph professional narrative summarizing the executive's performance across the reporting period.",
  "strengths": [
    "Specific strength 1 with exact KPI context",
    "Specific strength 2 with exact KPI context",
    "Specific strength 3 with exact KPI context"
  ],
  "improvement_areas": [
    "Specific area needing improvement 1 with exact KPI context",
    "Specific area needing improvement 2 with exact KPI context"
  ],
  "perspective_analysis": {
    "FINANCIAL": "1-2 sentences on financial cost control, variance, and margins.",
    "CUSTOMER": "1-2 sentences on client satisfaction, retention, and service delivery.",
    "INTERNAL_PROCESS": "1-2 sentences on process speed, turnaround, and operational bottlenecks.",
    "LEARNING_GROWTH": "1-2 sentences on leadership, team development, and training capability."
  },
  "recommendations": [
    "Actionable strategic recommendation 1 for next period",
    "Actionable strategic recommendation 2 for next period",
    "Actionable strategic recommendation 3 for next period"
  ]
}

DO NOT include markdown code fences like \`\`\`json in your response. Return ONLY raw JSON.`;
  }

  buildUserPrompt(submission: PerformanceSubmission): string {
    const execName = submission.executive
      ? `${submission.executive.first_name} ${submission.executive.last_name}`
      : 'Executive Manager';

    let prompt = `Executive Performance Evaluation Data:\n\n`;
    prompt += `**Executive Name:** ${execName}\n`;
    prompt += `**Reporting Cadence:** ${submission.period_type} (${submission.period_label})\n`;
    prompt += `**Overall Score:** ${submission.overall_score ?? 'N/A'}% (${submission.overall_rating ?? 'N/A'})\n\n`;

    prompt += `### Balanced Scorecard Perspective Summary:\n`;
    if (submission.perspective_scores && submission.perspective_scores.length > 0) {
      submission.perspective_scores.forEach((bsc) => {
        prompt += `- **${bsc.perspective}:** ${bsc.average_score}% (${bsc.rating})\n`;
      });
    } else {
      prompt += `No perspective scores aggregated.\n`;
    }

    prompt += `\n### Detailed KPI Breakdown:\n`;
    prompt += `| Perspective | Objective | Measurement | Unit | Plan | Actual | Achv % | Score | Rating | Notes |\n`;
    prompt += `|---|---|---|---|---|---|---|---|---|---|\n`;

    submission.entries.forEach((e) => {
      prompt += `| ${e.perspective} | ${e.objective} | ${e.measurement} | ${e.unit} | ${e.plan_value} | ${e.actual_value} | ${e.achievement_pct ?? '—'}% | ${e.score ?? '—'}% | ${e.rating ?? '—'} | ${e.notes || '—'} |\n`;
    });

    prompt += `\nPlease generate the executive analysis in JSON format as specified.`;

    return prompt;
  }
}
