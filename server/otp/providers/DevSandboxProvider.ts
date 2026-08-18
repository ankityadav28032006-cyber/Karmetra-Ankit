import { BaseOTPProvider, ProviderSendResult } from './BaseProvider';

export class DevSandboxProvider extends BaseOTPProvider {
  readonly name = 'dev-sandbox';

  public isConfigured(): boolean {
    return true;
  }

  public async sendOTP(
    mobile: string,
    otp: string,
    options?: { role?: string; templateId?: string }
  ): Promise<ProviderSendResult> {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const role = options?.role || 'candidate';

    // Safe Development Simulation: Does NOT send real SMS
    console.log(
      `[KarMetra DEV OTP SANDBOX] Simulated SMS dispatch to +91 ${cleanMobile} (${role}). Generated dynamic OTP.`
    );

    return {
      success: true,
      message: `Development OTP generated for +91 ${cleanMobile} (SMS not sent in dev mode)`,
      messageId: `dev-${Date.now()}`,
      provider: this.name
    };
  }
}
