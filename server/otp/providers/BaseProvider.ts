export interface ProviderSendResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
  provider: string;
}

export abstract class BaseOTPProvider {
  abstract readonly name: string;

  abstract sendOTP(
    mobile: string,
    otp: string,
    options?: { role?: string; templateId?: string }
  ): Promise<ProviderSendResult>;

  abstract isConfigured(): boolean;
}
