import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiAnalysis } from './entities/ai-analysis.entity';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { AiPromptService } from './ai-prompt.service';
import { SubmissionStatus } from '../common/constants/enums';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(AiAnalysis)
    private readonly aiAnalysisRepo: Repository<AiAnalysis>,
    @InjectRepository(PerformanceSubmission)
    private readonly submissionRepo: Repository<PerformanceSubmission>,
    private readonly promptService: AiPromptService,
    private readonly configService: ConfigService,
  ) {}

  async generateAnalysis(submissionId: string): Promise<AiAnalysis> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['executive', 'submitter', 'entries', 'perspective_scores'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    let analysisResult: any;
    let modelUsed = 'gemini-2.5-flash';

    if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim().length > 0) {
      try {
        this.logger.log(`Calling Gemini API (${modelUsed}) for submission ${submissionId}...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelUsed,
          systemInstruction: this.promptService.buildSystemPrompt(),
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const userPrompt = this.promptService.buildUserPrompt(submission);
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();

        analysisResult = JSON.parse(responseText);
      } catch (err: any) {
        this.logger.warn(
          `Gemini API call failed (${err.message}), switching to intelligent fallback generator.`,
        );
        analysisResult = this.generateFallbackAnalysis(submission);
        modelUsed = 'rule-based-advisor';
      }
    } else {
      this.logger.log(
        'GEMINI_API_KEY not configured. Generating intelligent contextual analysis.',
      );
      analysisResult = this.generateFallbackAnalysis(submission);
      modelUsed = 'contextual-analyzer';
    }

    // Save or update AiAnalysis record
    let aiAnalysis = await this.aiAnalysisRepo.findOne({
      where: { submission_id: submissionId },
    });

    if (!aiAnalysis) {
      aiAnalysis = this.aiAnalysisRepo.create({
        submission_id: submissionId,
        executive_summary: analysisResult.executive_summary,
        strengths: analysisResult.strengths || [],
        improvement_areas: analysisResult.improvement_areas || [],
        perspective_analysis: analysisResult.perspective_analysis || {},
        recommendations: analysisResult.recommendations || [],
        model_used: modelUsed,
      });
    } else {
      aiAnalysis.executive_summary = analysisResult.executive_summary;
      aiAnalysis.strengths = analysisResult.strengths || [];
      aiAnalysis.improvement_areas = analysisResult.improvement_areas || [];
      aiAnalysis.perspective_analysis = analysisResult.perspective_analysis || {};
      aiAnalysis.recommendations = analysisResult.recommendations || [];
      aiAnalysis.model_used = modelUsed;
    }

    const saved = await this.aiAnalysisRepo.save(aiAnalysis);

    // Update submission status to AI_ANALYZED
    if (
      submission.status === SubmissionStatus.DRAFT ||
      submission.status === SubmissionStatus.SUBMITTED ||
      submission.status === SubmissionStatus.CALCULATED
    ) {
      submission.status = SubmissionStatus.AI_ANALYZED;
      await this.submissionRepo.save(submission);
    }

    return saved;
  }

  async getAnalysisBySubmission(submissionId: string): Promise<AiAnalysis | null> {
    return this.aiAnalysisRepo.findOne({
      where: { submission_id: submissionId },
    });
  }

  async updateAnalysis(
    submissionId: string,
    updates: Partial<AiAnalysis>,
  ): Promise<AiAnalysis> {
    const analysis = await this.aiAnalysisRepo.findOne({
      where: { submission_id: submissionId },
    });

    if (!analysis) {
      throw new NotFoundException('AI Analysis not found for this submission');
    }

    Object.assign(analysis, updates);
    return this.aiAnalysisRepo.save(analysis);
  }

  /**
   * Generates intelligent, deterministic executive narrative from real scores
   * when Gemini API key is not supplied or during offline development.
   */
  private generateFallbackAnalysis(submission: PerformanceSubmission) {
    const execName = submission.executive
      ? `${submission.executive.first_name} ${submission.executive.last_name}`
      : 'Executive';

    const overallScore = submission.overall_score ?? 0;
    const overallRating = submission.overall_rating ?? 'Satisfactory';

    const highKpis = submission.entries.filter(
      (e) => (e.achievement_pct ?? 0) >= 90,
    );
    const lowKpis = submission.entries.filter(
      (e) => (e.achievement_pct ?? 0) < 85,
    );

    const strengths = highKpis.map(
      (k) =>
        `Strong execution in ${k.objective} achieving ${k.achievement_pct}% against target (${k.actual_value} ${k.unit} vs plan ${k.plan_value} ${k.unit}).`,
    );

    if (strengths.length === 0) {
      strengths.push(
        'Demonstrated foundational operational consistency across primary business metrics.',
      );
    }

    const improvementAreas = lowKpis.map(
      (k) =>
        `${k.objective} recorded ${k.achievement_pct}% achievement, underperforming against plan by ${Math.abs(Number(k.plan_value) - Number(k.actual_value)).toFixed(1)} ${k.unit}.`,
    );

    if (improvementAreas.length === 0) {
      improvementAreas.push(
        'Maintain cadence and establish stretch targets for upcoming quarterly cycles.',
      );
    }

    const perspectiveAnalysis: Record<string, string> = {};
    submission.perspective_scores?.forEach((p) => {
      perspectiveAnalysis[p.perspective] =
        `Performance in ${p.perspective.replace(/_/g, ' ')} perspective achieved an average score of ${p.average_score}% (${p.rating}). Metrics within this category demonstrated steady operational adherence.`;
    });

    const recommendations = [
      `Focus strategic operational alignment to close performance gaps in ${lowKpis[0]?.objective || 'key operational deliverables'}.`,
      `Leverage strong outcomes in ${highKpis[0]?.objective || 'high-performing areas'} to institutionalize best practices across department teams.`,
      `Conduct bi-weekly operational checkpoints leading into the next executive review cycle.`,
    ];

    const executiveSummary = `During the ${submission.period_label} reporting period, ${execName} achieved an overall performance score of ${overallScore}% with a rating of ${overallRating}. Performance across the Balanced Scorecard framework demonstrated strong momentum, particularly in strategic initiatives that met or exceeded planned milestones. Strategic focus should now be directed toward optimizing resource allocation and addressing variance in identified improvement areas to sustain long-term operational excellence.`;

    return {
      executive_summary: executiveSummary,
      strengths,
      improvement_areas: improvementAreas,
      perspective_analysis: perspectiveAnalysis,
      recommendations,
    };
  }
}
