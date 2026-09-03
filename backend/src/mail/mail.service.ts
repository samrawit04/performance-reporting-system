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
   * Dispatches an email notification to the CEO/Reviewer when a manager submits a report.
   * Includes the 7-day secure magic link allowing 1-click review access.
   */
  async sendSubmissionReadyForReview(params: {
    recipientEmail: string;
    recipientName: string;
    managerName: string;
    managerDepartment?: string;
    submissionLabel: string;
    overallScore: number | null;
    magicLinkUrl?: string;
  }): Promise<void> {
    const {
      recipientEmail,
      recipientName,
      managerName,
      managerDepartment,
      submissionLabel,
      overallScore,
      magicLinkUrl,
    } = params;

    const subject = `📋 Performance Report Ready for Review — ${submissionLabel} (${managerName})`;

    const magicButtonHtml = magicLinkUrl
      ? `<tr>
           <td style="padding:28px 40px;text-align:center;">
             <a href="${magicLinkUrl}" style="display:inline-block;background:linear-gradient(135deg,#4338CA 0%,#6366F1 100%);color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:15px 36px;border-radius:10px;box-shadow:0 4px 16px rgba(99,102,241,0.45);">
               ⚖️ Open Review Workspace &rarr;
             </a>
             <p style="margin:10px 0 0;font-size:11px;color:#9CA3AF;">Secure 1-click review access link valid for 7 days</p>
           </td>
         </tr>`
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Performance Report Ready for Review</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E1B4B 0%,#312E81 100%);padding:36px 40px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;color:#A5B4FC;text-transform:uppercase;">Executive Performance Monitoring System</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;">New Performance Report Submitted</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#C7D2FE;">${submissionLabel}</p>
            </td>
          </tr>

          <!-- Manager Details Banner -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px 20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Submitting Executive</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#0F172A;">${managerName}</p>
                    ${managerDepartment ? `<p style="margin:2px 0 0;font-size:12px;color:#64748B;">Department: ${managerDepartment}</p>` : ''}
                  </td>
                  <td align="right">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Calculated Score</p>
                    <p style="margin:0;font-size:24px;font-weight:900;color:#4338CA;">${overallScore !== null && overallScore !== undefined ? `${Number(overallScore).toFixed(1)}%` : 'Pending'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.7;">
                Hello <strong>${recipientName}</strong>,<br/>
                A new Balanced Scorecard performance report has been submitted and auto-calculated.
                The submission and its Gemini AI analytical breakdown are now ready for your review and sign-off.
              </p>
            </td>
          </tr>

          <!-- Magic Link Button -->
          ${magicButtonHtml}

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;border-top:1px solid #F3F4F6;margin-top:20px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
                This is an automated notification from the <strong>Executive Performance Reporting System</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `Hello ${recipientName},\n\n${managerName} (${managerDepartment || 'Management'}) has submitted a new performance report for "${submissionLabel}".\nCalculated Score: ${overallScore !== null && overallScore !== undefined ? `${Number(overallScore).toFixed(1)}%` : 'Pending'}\n\n${magicLinkUrl ? `Access Review Workspace (7-Day Magic Link):\n${magicLinkUrl}\n\n` : ''}Best regards,\nExecutive Performance System`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: recipientEmail,
          subject,
          html: htmlContent,
          text: textContent,
        });
        this.logger.log(`Submission review request email sent to ${recipientEmail}`);
      } catch (err: any) {
        this.logger.warn(`Failed to send review request email to ${recipientEmail}: ${err.message}`);
      }
    } else {
      this.logger.log(
        `[Review Request Email Dispatched] To: ${recipientEmail} | Subject: ${subject}\nMagic Link: ${magicLinkUrl}`,
      );
    }
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
    magicLinkUrl?: string,
  ): Promise<void> {
    const isApproved = action === 'APPROVED';
    const subject = isApproved
      ? `✅ Performance Report Approved — ${submissionLabel}`
      : `↩️ Performance Report Returned for Revision — ${submissionLabel}`;

    const textContent = `Hello ${recipientName},\n\nYour performance submission for "${submissionLabel}" has been ${
      isApproved ? 'APPROVED by executive review' : 'RETURNED for adjustments'
    }.\n\nReviewer Feedback:\n${feedbackSummary}${
      magicLinkUrl ? `\n\nDirect Portal Access (Secure 7-Day Link):\n${magicLinkUrl}` : ''
    }\n\nPlease visit the Performance Reporting portal to review details.\n\nBest regards,\nExecutive Management Team`;

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
    magicLinkUrl?: string;
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
      magicLinkUrl,
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

    const magicLinkHtml = magicLinkUrl
      ? `<tr>
           <td style="padding:24px 40px 0;text-align:center;">
             <a href="${magicLinkUrl}" style="display:inline-block;background:linear-gradient(135deg,#4338CA 0%,#6366F1 100%);color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
               🔗 View Report &amp; Feedback in Portal &rarr;
             </a>
             <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;">Secure 1-click access link valid for 7 days</p>
           </td>
         </tr>`
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
                  <td style="background:#DCFCE7;border:1px solid #86EFAC;border-radius:20px;padding:6px 14px;">
                    <span style="font-size:12px;font-weight:700;color:#15803D;letter-spacing:0.5px;">✓ OFFICIALLY APPROVED</span>
                  </td>
                  <td style="padding-left:12px;font-size:12px;color:#6B7280;">
                    Reviewed by <strong>${reviewerName}</strong>
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

          <!-- Score Highlight Box -->
          <tr>
            <td style="padding:20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;text-align:center;">
                <tr>
                  <td width="50%" style="padding:20px 24px;border-right:1px solid #E2E8F0;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#9CA3AF;text-transform:uppercase;">Overall Score</p>
                    <p style="margin:0;font-size:32px;font-weight:900;color:#4338CA;">${overallScore !== null && overallScore !== undefined ? `${overallScore}%` : '—'}</p>
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

          <!-- Magic Link CTA Button -->
          ${magicLinkHtml}

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
      text: `Hello ${recipientName},\n\nYour performance report for "${submissionLabel}" has been APPROVED by ${reviewerName}.\n\nOverall Score: ${overallScore ?? '—'}%  |  Rating: ${overallRating ?? 'Satisfactory'}\n\nCEO Feedback:\n${feedbackSummary}${magicLinkUrl ? `\n\nView in Portal: ${magicLinkUrl}` : ''}\n\nThe official signed PDF report is attached.\n\nBest regards,\nExecutive Management Team`,
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

  /**
   * Dispatches a Password Reset link email to a user.
   */
  async sendPasswordResetEmail(params: {
    recipientEmail: string;
    recipientName: string;
    resetUrl: string;
  }): Promise<void> {
    const { recipientEmail, recipientName, resetUrl } = params;
    const subject = `🔑 Password Reset Request — Executive Performance System`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset Request</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #E2E8F0;">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0D1B2A 0%,#0077B6 100%);padding:32px 36px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#93C5FD;text-transform:uppercase;">Performance Reporting System</p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">Password Reset Request</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:28px 36px 0;">
              <p style="margin:0;font-size:15px;color:#1E293B;">Hello <strong>${recipientName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:14px;color:#475569;line-height:1.6;">
                We received a request to reset your password for your Executive Performance System account. Click the button below to set a new password:
              </p>
            </td>
          </tr>

          <!-- Reset Button -->
          <tr>
            <td style="padding:24px 36px;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;background:#0077B6;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(0,119,182,0.35);">
                Reset My Password &rarr;
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#94A3B8;">This reset link is valid for 1 hour.</p>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding:0 36px 28px;">
              <p style="margin:0;font-size:12px;color:#64748B;line-height:1.5;background:#F1F5F9;padding:12px 16px;border-radius:8px;">
                If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #F1F5F9;">
              <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.5;">
                Executive Performance Reporting System &bull; Automated System Security Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `Hello ${recipientName},\n\nYou requested a password reset for your Executive Performance System account.\n\nUse this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: recipientEmail,
          subject,
          html: htmlContent,
          text: textContent,
        });
        this.logger.log(`Password reset email sent to ${recipientEmail}`);
      } catch (err: any) {
        this.logger.warn(`Failed to send password reset email to ${recipientEmail}: ${err.message}`);
      }
    } else {
      this.logger.log(
        `[Password Reset Link Dispatched] To: ${recipientEmail}\nReset URL: ${resetUrl}`,
      );
    }
  }
}
