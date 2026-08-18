/**
 * KarMetra Razorpay Checkout SDK Helper
 * Dynamically loads the official Razorpay Checkout SDK script and opens the payment modal.
 */

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayPaymentSuccessPayload) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Loads the Razorpay checkout.js script asynchronously
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Trigger Razorpay checkout modal
 */
export const launchRazorpayPayment = async (config: {
  keyId: string;
  orderId: string;
  amountInPaise: number;
  currency?: string;
  title?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpayPaymentSuccessPayload) => void;
  onDismiss?: () => void;
  onError?: (err: Error) => void;
}) => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !(window as any).Razorpay) {
    // If external script is blocked or offline, fail gracefully
    const error = new Error('Razorpay Checkout SDK could not be loaded. Please check your internet connection.');
    if (config.onError) config.onError(error);
    else alert(error.message);
    return;
  }

  const options: RazorpayOptions = {
    key: config.keyId,
    amount: config.amountInPaise,
    currency: config.currency || 'INR',
    name: 'KarMetra Platform',
    description: config.description || config.title || 'KarMetra Payment Transaction',
    image: 'https://karmetra.in/favicon.ico',
    order_id: config.orderId,
    prefill: {
      name: config.prefill?.name || '',
      email: config.prefill?.email || '',
      contact: config.prefill?.contact || ''
    },
    notes: {
      platform: 'KarMetra Enterprise',
      helpline: '9049217304'
    },
    theme: {
      color: '#0d9488' // KarMetra Teal brand color
    },
    handler: (response: RazorpayPaymentSuccessPayload) => {
      config.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        if (config.onDismiss) config.onDismiss();
      }
    }
  };

  try {
    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      console.error('Razorpay payment failed:', response.error);
      const errMsg = response.error?.description || 'Payment transaction failed or cancelled';
      if (config.onError) config.onError(new Error(errMsg));
      else alert(`Payment Failed: ${errMsg}`);
    });
    rzp.open();
  } catch (err: any) {
    console.error('Error invoking Razorpay instance:', err);
    if (config.onError) config.onError(err);
  }
};
