import { BaseOTPProvider, ProviderSendResult } from './BaseProvider';

export class MSG91Provider extends BaseOTPProvider {
  readonly name = 'msg91';
  private authKey: string;
  private templateId?: string;
  private senderId?: string;

  constructor(authKey?: string, templateId?: string, senderId?: string) {
    super();
    this.authKey = authKey || '';
    this.templateId = templateId;
    this.senderId = senderId || 'KARMET';
  }

  public isConfigured(): boolean {
    return Boolean(this.authKey && this.authKey.trim().length > 5);
  }

  public async sendOTP(
    mobile: string,
    otp: string,
    options?: { role?: string; templateId?: string }
  ): Promise<ProviderSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'MSG91 Auth Key is not configured',
        error: 'MSG91_AUTH_KEY_MISSING',
        provider: this.name
      };
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const template = options?.templateId || this.templateId;

    try {
      // MSG91 OTP API endpoint
      const url = new URL('https://control.msg91.com/api/v5/otp');
      url.searchParams.append('template_id', template || '');
      url.searchParams.append('mobile', `91${cleanMobile}`);
      url.searchParams.append('authkey', this.authKey);
      url.searchParams.append('otp', otp);
      if (this.senderId) {
        url.searchParams.append('sender', this.senderId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.type === 'success') {
        return {
          success: true,
          message: 'OTP sent successfully via MSG91',
          messageId: data.message || `msg91-${Date.now()}`,
          provider: this.name
        };
      }

      const errMsg = data.message || 'MSG91 dispatch failed';
      return {
        success: false,
        message: errMsg,
        error: `MSG91_ERROR: ${errMsg}`,
        provider: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error communicating with MSG91 gateway',
        error: err.message,
        provider: this.name
      };
    }
  }
}
