'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DepositSuccess() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = localStorage.getItem('paystack_reference');
        const transactionType = localStorage.getItem('transaction_type');

        if (!reference || transactionType !== 'deposit') {
          throw new Error('Invalid transaction');
        }

        const response = await fetch('/api/verify-deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Deposit successful!');
          // Clear the stored reference
          localStorage.removeItem('paystack_reference');
          localStorage.removeItem('transaction_type');
          // Redirect to profile or dashboard
          router.push('/dashboard');
        } else {
          throw new Error(data.error || 'Failed to verify payment');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment');
        router.push('/dashboard');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isVerifying ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Verifying your deposit...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </>
        ) : (
          <h1 className="text-2xl font-bold">Redirecting...</h1>
        )}
      </div>
    </div>
  );
} 