import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocumentRaw from 'pdfkit';
import { PerformanceSubmission } from '../performance/entities/performance-submission.entity';
import { AiAnalysis } from '../ai/entities/ai-analysis.entity';
import { ReviewFeedback } from '../review/entities/review-feedback.entity';

// Robust fallback for PDFKit CommonJS / ES Module interop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument: any =
  (PDFDocumentRaw as any)?.default ||
  PDFDocumentRaw ||
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('pdfkit');

@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  async generateExecutiveReportPdf(
    submission: PerformanceSubmission,
    aiAnalysis?: AiAnalysis | null,
    reviewFeedback?: ReviewFeedback | null,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Executive Performance Report — ${submission.period_label}`,
            Author: 'Executive Performance Reporting System',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => {
          this.logger.error('PDFKit error occurred:', err);
          reject(err);
        });

        const primaryColor = '#4338CA'; // Indigo
        const darkColor = '#0F172A'; // Slate 900
        const mutedColor = '#64748B'; // Slate 500
        const lightBg = '#F8FAFC'; // Slate 50
        const borderColor = '#E2E8F0'; // Slate 200

        const execName = submission.executive
          ? `${submission.executive.first_name} ${submission.executive.last_name}`
          : 'Executive';

        // ─────────────────────────────────────────────────────────────
        // 1. Header & Title Banner
        // ─────────────────────────────────────────────────────────────
        doc.rect(40, 40, 515, 65).fill(primaryColor);

        doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold');
        doc.text('EXECUTIVE PERFORMANCE REPORT', 55, 52);

        doc.fontSize(10).font('Helvetica');
        doc.text(
          `Balanced Scorecard Evaluation • ${submission.period_label}`,
          55,
          74,
        );

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(
          `STATUS: ${submission.status}`,
          380,
          74,
          { align: 'right', width: 160 },
        );

        let currentY = 118;

        // ─────────────────────────────────────────────────────────────
        // 2. Executive Profile & Overall Score Gauge Box
        // ─────────────────────────────────────────────────────────────
        // Left box: Executive Profile
        doc.rect(40, currentY, 340, 70).fillAndStroke(lightBg, borderColor);
        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold');
        doc.text(execName, 52, currentY + 12);

        doc.fillColor(mutedColor).fontSize(9).font('Helvetica');
        doc.text(
          `Department: ${submission.executive?.department || 'Executive Leadership'}`,
          52,
          currentY + 28,
        );
        doc.text(
          `Cadence: ${submission.period_type} | Evaluated: ${new Date(
            submission.created_at || Date.now(),
          ).toLocaleDateString()}`,
          52,
          currentY + 44,
        );

        // Right box: Overall Score
        doc.rect(390, currentY, 165, 70).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(8).font('Helvetica-Bold');
        doc.text('OVERALL SCORE', 390, currentY + 10, {
          align: 'center',
          width: 165,
        });

        doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold');
        doc.text(
          `${submission.overall_score ?? '—'}%`,
          390,
          currentY + 24,
          { align: 'center', width: 165 },
        );

        doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold');
        doc.text(
          submission.overall_rating || 'Unrated',
          390,
          currentY + 48,
          { align: 'center', width: 165 },
        );

        currentY += 82;

        // ─────────────────────────────────────────────────────────────
        // 3. 4 Balanced Scorecard Perspectives Summary Cards
        // ─────────────────────────────────────────────────────────────
        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold');
        doc.text('BALANCED SCORECARD PERSPECTIVE BREAKDOWN', 40, currentY);
        currentY += 16;

        const perspectives = [
          { key: 'FINANCIAL', label: '1. Financial' },
          { key: 'CUSTOMER', label: '2. Customer' },
          { key: 'INTERNAL_PROCESS', label: '3. Internal Process' },
          { key: 'LEARNING_GROWTH', label: '4. Learning & Growth' },
        ];

        const cardWidth = 122;
        const cardHeight = 46;
        const cardGap = 9;

        perspectives.forEach((p, idx) => {
          const x = 40 + idx * (cardWidth + cardGap);
          const bsc = submission.perspective_scores?.find(
            (s) => s.perspective === p.key,
          );

          doc.rect(x, currentY, cardWidth, cardHeight).fillAndStroke(
            lightBg,
            borderColor,
          );

          doc.fillColor(mutedColor).fontSize(7.5).font('Helvetica-Bold');
          doc.text(p.label, x + 6, currentY + 6, { width: cardWidth - 12 });

          doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold');
          doc.text(`${bsc ? bsc.average_score : '—'}%`, x + 6, currentY + 18);

          doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold');
          doc.text(bsc ? bsc.rating : '—', x + 6, currentY + 34);
        });

        currentY += 58;

        // ─────────────────────────────────────────────────────────────
        // 4. Executive Summary Narrative (AI or Calculated)
        // ─────────────────────────────────────────────────────────────
        const summaryText =
          aiAnalysis?.executive_summary ||
          `During the ${submission.period_label} period, ${execName} achieved an overall performance score of ${
            submission.overall_score ?? 0
          }% (${
            submission.overall_rating ?? 'Satisfactory'
          }), adhering to Balanced Scorecard deliverables and strategic organizational goals.`;

        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold');
        doc.text('EXECUTIVE SUMMARY', 40, currentY);
        currentY += 14;

        doc.rect(40, currentY, 515, 62).fillAndStroke(lightBg, borderColor);
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica');
        doc.text(summaryText, 48, currentY + 8, {
          width: 499,
          lineGap: 2.5,
          height: 48,
          ellipsis: true,
        });

        currentY += 74;

        // ─────────────────────────────────────────────────────────────
        // 5. Strengths & Improvement Areas
        // ─────────────────────────────────────────────────────────────
        if (aiAnalysis) {
          const colW = 252;
          // Strengths
          doc.rect(40, currentY, colW, 58).fillAndStroke('#ECFDF5', '#A7F3D0');
          doc.fillColor('#065F46').fontSize(8.5).font('Helvetica-Bold');
          doc.text('KEY STRENGTHS', 48, currentY + 6);
          doc.fillColor('#064E3B').fontSize(7.5).font('Helvetica');
          const strList = (aiAnalysis.strengths || []).slice(0, 2).join('\n• ');
          doc.text(strList ? `• ${strList}` : '• Consistent operational execution.', 48, currentY + 18, {
            width: colW - 16,
            lineGap: 2,
            height: 34,
            ellipsis: true,
          });

          // Improvement Areas
          doc.rect(303, currentY, colW, 58).fillAndStroke('#FFFBEB', '#FDE68A');
          doc.fillColor('#92400E').fontSize(8.5).font('Helvetica-Bold');
          doc.text('FOCUS & IMPROVEMENT AREAS', 311, currentY + 6);
          doc.fillColor('#78350F').fontSize(7.5).font('Helvetica');
          const impList = (aiAnalysis.improvement_areas || []).slice(0, 2).join('\n• ');
          doc.text(impList ? `• ${impList}` : '• Expand stretch goal metrics.', 311, currentY + 18, {
            width: colW - 16,
            lineGap: 2,
            height: 34,
            ellipsis: true,
          });

          currentY += 68;
        }

        // ─────────────────────────────────────────────────────────────
        // 6. Detailed KPI Performance Table
        // ─────────────────────────────────────────────────────────────
        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold');
        doc.text('KEY PERFORMANCE INDICATORS (KPIs) BREAKDOWN', 40, currentY);
        currentY += 14;

        // Table Header
        const thY = currentY;
        doc.rect(40, thY, 515, 18).fill(darkColor);
        doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
        doc.text('PERSPECTIVE', 45, thY + 5, { width: 85 });
        doc.text('STRATEGIC OBJECTIVE', 132, thY + 5, { width: 140 });
        doc.text('UNIT', 274, thY + 5, { width: 30 });
        doc.text('PLAN', 306, thY + 5, { width: 38, align: 'right' });
        doc.text('ACTUAL', 346, thY + 5, { width: 42, align: 'right' });
        doc.text('ACHV %', 390, thY + 5, { width: 42, align: 'right' });
        doc.text('SCORE', 434, thY + 5, { width: 40, align: 'right' });
        doc.text('RATING', 476, thY + 5, { width: 75, align: 'center' });

        currentY += 18;

        // Table Rows
        const entries = submission.entries || [];
        const displayEntries = entries.slice(0, 7);

        displayEntries.forEach((e, idx) => {
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : lightBg;
          doc.rect(40, currentY, 515, 16).fillAndStroke(rowBg, borderColor);

          doc.fillColor(darkColor).fontSize(6.8).font('Helvetica');
          doc.text(e.perspective || '', 45, currentY + 4, { width: 85 });
          doc.text(e.objective || '', 132, currentY + 4, { width: 140, ellipsis: true });
          doc.text(e.unit || '', 274, currentY + 4, { width: 30 });
          doc.text(String(e.plan_value ?? 0), 306, currentY + 4, { width: 38, align: 'right' });
          doc.text(String(e.actual_value ?? 0), 346, currentY + 4, { width: 42, align: 'right' });
          doc.text(`${e.achievement_pct ?? '—'}%`, 390, currentY + 4, { width: 42, align: 'right' });
          doc.text(`${e.score ?? '—'}%`, 434, currentY + 4, { width: 40, align: 'right' });
          doc.text(e.rating || '—', 476, currentY + 4, { width: 75, align: 'center' });

          currentY += 16;
        });

        currentY += 10;

        // ─────────────────────────────────────────────────────────────
        // 7. Executive Sign-Off & CEO Commentary
        // ─────────────────────────────────────────────────────────────
        if (reviewFeedback) {
          doc.rect(40, currentY, 515, 62).fillAndStroke('#EEF2FF', '#C7D2FE');

          const reviewerName = reviewFeedback.reviewer
            ? `${reviewFeedback.reviewer.first_name} ${reviewFeedback.reviewer.last_name}`
            : 'Executive Reviewer (CEO)';

          doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold');
          doc.text(
            `OFFICIAL EXECUTIVE REVIEW & SIGN-OFF (${reviewFeedback.action || 'APPROVED'})`,
            48,
            currentY + 6,
          );

          doc.fillColor(mutedColor).fontSize(7.5).font('Helvetica');
          doc.text(`Reviewed by: ${reviewerName}`, 48, currentY + 18);

          doc.fillColor(darkColor).fontSize(7.8).font('Helvetica');
          doc.text(
            reviewFeedback.overall_feedback || 'Performance confirmed and approved.',
            48,
            currentY + 28,
            { width: 499, lineGap: 1.5, height: 28, ellipsis: true },
          );
        }

        // ─────────────────────────────────────────────────────────────
        // 8. Footer Notice
        // ─────────────────────────────────────────────────────────────
        doc.fillColor(mutedColor).fontSize(7).font('Helvetica');
        doc.text(
          'CONFIDENTIAL • Executive Performance Reporting System • Generated on ' +
            new Date().toLocaleString(),
          40,
          770,
          { align: 'center', width: 515 },
        );

        doc.end();
      } catch (err) {
        this.logger.error('Failed to construct PDF report document:', err);
        reject(err);
      }
    });
  }
}
