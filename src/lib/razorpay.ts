// Utility for real Razorpay Checkout integration
// https://checkout.razorpay.com/v1/checkout.js

export interface RazorpayOptions {
  key?: string;
  amount: number; // in paise (e.g. 500000 for ₹5,000)
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
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (resp: any) => void) => void;
    };
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load official Razorpay SDK script from CDN, using built-in high-fidelity fallback modal.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

export const getRazorpayKeyId = (): string => {
  // Read Razorpay API Key from environment variables (NEXT_PUBLIC_RAZORPAY_KEY_ID prioritized)
  const nextEnvKey = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID : undefined;
  const metaNextKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string) : undefined;
  const viteKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_RAZORPAY_KEY_ID as string) : undefined;
  return nextEnvKey || metaNextKey || viteKey || 'rzp_test_VerilanceEscrowDemoKey';
};
