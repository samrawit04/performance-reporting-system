import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get<string>('MAIL_PORT') || 587),
        secure: false,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mail Transport configured for host: ${host}`);
    } else {
      this.logger.log('SMTP not configured. Email notifications will log to console.');
    }
  }

  private get from(): string {
    return (
      this.configService.get<string>('MAIL_FROM') ||
      '"Performance Reporting System" <noreply@performance.com>'
    );
  }

  /**
   * Sends a simple plain-text review notification (e.g. for RETURNED status).
   */
  async sendReviewNotification(
    recipientEmail: string,
    recipientName: string,
    submissionLabel: string,
    action: 'APPROVED' | 'RETURNED',
    feedbackSummary: string,
  ): Promise<void> {
    const isApproved = action === 'APPROVED';
    const subject = isApproved
      ? `✅ Performance Report Approved — ${submissionLabel}`
      : `↩️ Performance Report Returned for Revision — ${submissionLabel}`;

    const textContent = `Hello ${recipientName},\n\nYour performance submission for "${submissionLabel}" has been ${
      isApproved ? 'APPROVED by executive review' : 'RETURNED for adjustments'
    }.\n\nReviewer Feedback:\n${feedbackSummary}\n\nPlease visit the Performance Reporting portal to review details.\n\nBest regards,\nExecutive Management Team`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: recipientEmail,
          subject,
          text: textContent,
        });
        this.logger.log(`Email notification sent to ${recipientEmail}`);
      } catch (err: any) {
        this.logger.warn(`Failed to send email to ${recipientEmail}: ${err.message}`);
      }
    } else {
      this.logger.log(
        `[Email Notification Dispatched] To: ${recipientEmail} | Subject: ${subject}\nMessage: ${textContent}`,
      );
    }
  }

  /**
   * Sends a rich HTML approval email with the executive PDF report attached.
   * Called when the CEO/Reviewer APPROVES a submission.
   */
  async sendApprovalWithPdf(params: {
    recipientEmail: string;
    recipientName: string;
    reviewerName: string;
    submissionLabel: string;
    overallScore: number | null;
    overallRating: string | null;
    feedbackSummary: string;
    recommendedFocusAreas?: string[];
    pdfBuffer: Buffer;
    pdfFilename: string;
  }): Promise<void> {
    const {
      recipientEmail,
      recipientName,
      reviewerName,
      submissionLabel,
      overallScore,
      overallRating,
      feedbackSummary,
      recommendedFocusAreas = [],
      pdfBuffer,
      pdfFilename,
    } = params;

    const subject = `✅ Performance Report Officially Approved — ${submissionLabel}`;

    const focusAreasHtml =
      recommendedFocusAreas.length > 0
        ? `<div style="margin-top:18px;">
            <p style="margin:0 0 8px;font-weight:600;color:#374151;">Recommended Focus Areas for Next Period:</p>
            <ul style="margin:0;padding-left:20px;color:#4B5563;">
              ${recommendedFocusAreas.map((f) => `<li style="margin-bottom:4px;">${f}</li>`).join('')}
            </ul>
          </div>`
        : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Performance Report Approved</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#4338CA 0%,#6366F1 100%);padding:36px 40px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;color:#C7D2FE;text-transform:uppercase;">Executive Performance Reporting System</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;">Performance Report Approved</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#A5B4FC;">${submissionLabel}</p>
            </td>
          </tr>

          <!-- Approval Badge -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ECFDF5;border:1.5px solid #6EE7B7;border-radius:8px;padding:12px 20px;">
                    <span style="font-size:20px;">✅</span>
                    <span style="margin-left:10px;font-size:14px;font-weight:700;color:#065F46;">OFFICIALLY APPROVED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0;font-size:15px;color:#111827;">Dear <strong>${recipientName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.65;">
                Your performance report for the <strong>${submissionLabel}</strong> evaluation period has been officially reviewed and <strong style="color:#059669;">APPROVED</strong> by <strong>${reviewerName}</strong>. Please find the official signed report attached to this email as a PDF.
              </p>
            </td>
          </tr>

          <!-- Score Summary -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
                <tr>
                  <td width="50%" style="padding:20px 24px;border-right:1px solid #E5E7EB;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#9CA3AF;text-transform:uppercase;">Overall Score</p>
                    <p style="margin:0;font-size:28px;font-weight:800;color:#4338CA;">${overallScore !== null && overallScore !== undefined ? overallScore + '%' : '—'}</p>
                  </td>
                  <td width="50%" style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#9CA3AF;text-transform:uppercase;">Performance Rating</p>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#111827;">${overallRating || 'Satisfactory'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CEO Feedback -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.5px;color:#374151;text-transform:uppercase;">Official CEO / Reviewer Feedback</p>
              <div style="background:#EEF2FF;border-left:4px solid #4338CA;border-radius:6px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;color:#1E1B4B;line-height:1.7;">${feedbackSummary}</p>
              </div>
              ${focusAreasHtml}
            </td>
          </tr>

          <!-- PDF Attachment Notice -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px 20px;width:100%;">
                <tr>
                  <td>
                    <span style="font-size:18px;">📄</span>
                    <span style="margin-left:10px;font-size:13px;font-weight:600;color:#14532D;">Official Performance Report PDF is attached to this email.</span>
                    <p style="margin:6px 0 0;font-size:12px;color:#166534;">The attached PDF is the authorised copy of your Balanced Scorecard evaluation, including all KPI details and CEO sign-off.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;border-top:1px solid #F3F4F6;margin-top:24px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                This is an automated notification from the <strong>Executive Performance Reporting System</strong>.<br/>
                Please do not reply to this email. Contact your HR administrator for queries.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.from,
      to: recipientEmail,
      subject,
      html: htmlContent,
      text: `Hello ${recipientName},\n\nYour performance report for "${submissionLabel}" has been APPROVED by ${reviewerName}.\n\nOverall Score: ${overallScore ?? '—'}%  |  Rating: ${overallRating ?? 'Satisfactory'}\n\nCEO Feedback:\n${feedbackSummary}\n\nThe official signed PDF report is attached.\n\nBest regards,\nExecutive Management Team`,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(
          `Approval email with PDF sent to ${recipientEmail}. MessageId: ${info.messageId}`,
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to send approval email with PDF to ${recipientEmail}: ${err.message}`,
        );
      }
    } else {
      this.logger.log(
        `[Approval Email + PDF Dispatched] To: ${recipientEmail} | Subject: ${subject}\nPDF Filename: ${pdfFilename} (${pdfBuffer.length} bytes)\nFeedback: ${feedbackSummary}`,
      );
    }
  }
}
