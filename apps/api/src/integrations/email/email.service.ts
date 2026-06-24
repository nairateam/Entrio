import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Transactional email via Resend. If `RESEND_API_KEY` is absent (e.g. local dev),
 * sends are skipped and `send()` returns false so callers can fall back (e.g. log
 * an invite link) instead of failing.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('EMAIL_FROM') ?? 'Entrio <onboarding@resend.dev>';
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn('Resend not configured (RESEND_API_KEY missing) — emails will be skipped.');
    }
  }

  get isConfigured(): boolean {
    return this.resend !== null;
  }

  /** Send an email; returns true if accepted by Resend, false if skipped/failed. */
  async send({ to, subject, html }: SendEmailArgs): Promise<boolean> {
    if (!this.resend) return false;
    try {
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (error) {
        this.logger.error(`Resend rejected "${subject}" to ${to}: ${error.message}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Email send failed for "${subject}" to ${to}`, err as Error);
      return false;
    }
  }
}
