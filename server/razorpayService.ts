import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface CreateOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  receipt?: string;
  keyId?: string;
}

export interface VerifySignatureParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

class RazorpayService {
  private client: Razorpay | null = null;

  private getClient(): Razorpay | null {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      return null;
    }

    if (!this.client) {
      this.client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    }

    return this.client;
  }

  public isConfigured(): boolean {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    return Boolean(keyId && keySecret);
  }

  public getPublicKeyId(): string {
    return process.env.RAZORPAY_KEY_ID?.trim() || '';
  }

  public async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const client = this.getClient();

    if (client) {
      try {
        const options = {
          amount: Math.round(params.amountInPaise),
          currency: params.currency || 'INR',
          receipt: params.receipt || `rcpt_${Date.now()}`,
          notes: params.notes || {}
        };

        const order = await client.orders.create(options);
        return {
          orderId: order.id,
          amount: Number(order.amount),
          currency: order.currency,
          receipt: order.receipt || params.receipt,
          keyId: this.getPublicKeyId()
        };
      } catch (err: any) {
        console.error('[RazorpayService] Live order creation error:', err);
        throw new Error(err.error?.description || err.message || 'Failed to create Razorpay payment order');
      }
    }

    // Fallback: When RAZORPAY keys are not configured in environment variables,
    // generate a structured test order for dev/preview testing
    console.warn('[RazorpayService] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in server environment. Creating sandbox test order.');
    const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      orderId: simulatedOrderId,
      amount: Math.round(params.amountInPaise),
      currency: params.currency || 'INR',
      receipt: params.receipt || `rcpt_${Date.now()}`,
      keyId: this.getPublicKeyId()
    };
  }

  public verifyPaymentSignature(params: VerifySignatureParams): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    if (keySecret) {
      try {
        const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(payload)
          .digest('hex');

        const expectedBuffer = Buffer.from(expectedSignature);
        const actualBuffer = Buffer.from(razorpaySignature);

        if (expectedBuffer.length !== actualBuffer.length) {
          return false;
        }

        return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
      } catch (err) {
        console.error('[RazorpayService] Signature verification exception:', err);
        return false;
      }
    }

    // In sandbox simulation (keys not provided), accept test signatures if order is simulated
    if (razorpayOrderId.startsWith('order_sim_') || razorpayOrderId.startsWith('order_test_')) {
      return true;
    }

    return false;
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret || !signature || !rawBody) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature);
      const actualBuffer = Buffer.from(signature);

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch (err) {
      console.error('[RazorpayService] Webhook signature verification error:', err);
      return false;
    }
  }
}

export const razorpayService = new RazorpayService();
