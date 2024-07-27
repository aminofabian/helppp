import axios from 'axios';
import { loadScript } from '../utils/scriptloader';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

const initializePaystack = (email: string, amount: number, onSuccess: (reference: string) => void, onClose: () => void) => {
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  loadScript('https://js.paystack.co/v1/inline.js').then(() => {
    if (window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: paystackKey!,
        email,
        amount: amount * 100, // Convert to lowest currency unit
        currency: 'KES', // Change this to 'GHS', 'ZAR', or 'USD' as needed
        ref: `fitri${Date.now()}`,
        callback: (response: { reference: string }) => {
          onSuccess(response.reference);
        },
        onClose: onClose,
        onError: (error: any) => {
          console.error('Paystack error:', error);
          // Handle the error (e.g., show an error message to the user)
        },
      });
      handler.openIframe();
    } else {
      console.error('PaystackPop is not available');
    }
  }).catch(error => {
    console.error('Failed to load Paystack script:', error);
  });
};

export { initializePaystack };