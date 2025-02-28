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

        console.log('Verifying payment:', { reference, transactionType });

        if (!reference) {
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
        console.log('Verification response:', data);

        if (data.success) {
          toast.success('Payment successful!');
          // Clear the stored reference
          localStorage.removeItem('paystack_reference');
          localStorage.removeItem('transaction_type');
          
          // Dispatch wallet update events based on transaction type
          if (data.transactionType === 'deposit') {
            const depositEvent = new CustomEvent('wallet-updated', {
              detail: { 
                type: 'deposit',
                balance: data.depositWalletBalance 
              }
            });
            window.dispatchEvent(depositEvent);
            console.log('Dispatched deposit wallet update event:', depositEvent.detail);
          } else {
            const walletEvent = new CustomEvent('wallet-updated', {
              detail: { 
                type: 'regular',
                balance: data.walletBalance 
              }
            });
            window.dispatchEvent(walletEvent);
            console.log('Dispatched regular wallet update event:', walletEvent.detail);
          }
          
          // Redirect to dashboard with a small delay to ensure state updates
          setTimeout(() => {
            router.push('/');
          }, 1000);
        } else {
          throw new Error(data.error || 'Failed to verify payment');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Failed to verify payment');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verifying Payment...</h1>
          <p>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return null;
} 