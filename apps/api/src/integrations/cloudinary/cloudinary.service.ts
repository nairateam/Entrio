import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Thin wrapper around the Cloudinary SDK for visitor headshots (PRD §4.1.7).
 * Server-side uploads keep the API key/secret off the client. If credentials are
 * absent (e.g. local dev), uploads are skipped gracefully so check-in still works.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.logger.warn('Cloudinary not configured — headshot uploads will be skipped.');
    }
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Upload a headshot (a base64 data URL or remote URL) and return its secure URL.
   * Returns null if Cloudinary isn't configured or the upload fails — callers should
   * treat a missing URL as "no new photo" rather than failing the check-in.
   */
  async uploadHeadshot(image: string, publicId: string): Promise<string | null> {
    return this.upload(image, publicId, 'entrio/headshots');
  }

  /** Upload a drawn signature image (PRD v2 §3 Step 7). */
  async uploadSignature(image: string, publicId: string): Promise<string | null> {
    return this.upload(image, publicId, 'entrio/signatures');
  }

  /** Upload a base64 data URL (or remote URL) to a folder; null if not configured/failed. */
  async upload(image: string, publicId: string, folder: string): Promise<string | null> {
    if (!this.configured) return null;
    try {
      const result = await cloudinary.uploader.upload(image, {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Upload failed for ${folder}/${publicId}`, error as Error);
      return null;
    }
  }
}
