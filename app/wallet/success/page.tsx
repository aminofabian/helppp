'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference') || localStorage.getItem('paystack_reference');
        
        if (!reference) {
          toast.error('Invalid payment reference');
          router.push('/');
          return;
        }

        // Verify the payment
        const response = await fetch('/api/verify-paystack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Payment successful! Your wallet has been credited.');
          // Clear the reference from localStorage
          localStorage.removeItem('paystack_reference');
          // Redirect back to home or wallet page
          router.push('/');
        } else {
          throw new Error(data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Failed to verify payment');
        router.push('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [router, searchParams]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Verifying your payment...</h2>
          <p className="text-sm text-gray-500">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  return null;
} 