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
          from:
            this.configService.get<string>('MAIL_FROM') ||
            '"Performance Reporting System" <noreply@performance.com>',
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
}
