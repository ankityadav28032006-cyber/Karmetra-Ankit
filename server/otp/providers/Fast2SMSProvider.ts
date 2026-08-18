import { BaseOTPProvider, ProviderSendResult } from './BaseProvider';

export class Fast2SMSProvider extends BaseOTPProvider {
  readonly name = 'fast2sms';
  private apiKey: string;
  private templateId?: string;

  constructor(apiKey?: string, templateId?: string) {
    super();
    this.apiKey = apiKey || '';
    this.templateId = templateId;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  public async sendOTP(
    mobile: string,
    otp: string,
    options?: { role?: string; templateId?: string }
  ): Promise<ProviderSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Fast2SMS API Key is not configured',
        error: 'FAST2SMS_API_KEY_MISSING',
        provider: this.name
      };
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    try {
      const template = options?.templateId || this.templateId;
      
      const payload: Record<string, any> = {
        variables_values: otp,
        route: 'otp',
        numbers: cleanMobile
      };

      if (template) {
        payload.template_id = template;
      }

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.return === true) {
        return {
          success: true,
          message: 'OTP sent successfully via Fast2SMS',
          messageId: data.request_id || `f2s-${Date.now()}`,
          provider: this.name
        };
      }

      const errMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Fast2SMS dispatch failed');
      return {
        success: false,
        message: errMsg,
        error: `FAST2SMS_ERROR: ${errMsg}`,
        provider: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error communicating with Fast2SMS gateway',
        error: err.message,
        provider: this.name
      };
    }
  }
}
