import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { toast } from 'sonner';

interface DonationFormProps {
  requestId: string;
}

const emitDonationEvent = (amount: number, points: number, updatedStats: any) => {
  if (typeof window !== 'undefined') {
    const donationEvent = new CustomEvent('donation-made', {
      detail: {
        amount: Number(amount),
        points,
        totalPoints: updatedStats.points,
        level: updatedStats.level,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(donationEvent);
  }
};

async function processPayment(amount: string, userId: string, requestId: string) {
  const paymentResponse = await fetch('/api/payments/donate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Number(amount),
      requestId,
      userId
    }),
  });

  if (!paymentResponse.ok) {
    throw new Error('Payment failed');
  }

  return paymentResponse.json();
}

export default function DonationForm({ requestId }: DonationFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useKindeBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || loading || !user) return;

    setLoading(true);

    try {
      // Process payment
      const paymentData = await processPayment(amount, user.id, requestId);

      // If payment successful, update user stats
      if (paymentData.success) {
        // Calculate points (1 point per 50 KES)
        const points = Math.floor(Number(amount) / 50);
        
        // Update user stats in database
        const statsResponse = await fetch('/api/user-stats/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            amount: Number(amount),
            points,
            donationType: paymentData.paymentId
          }),
        });

        if (!statsResponse.ok) {
          console.error('Failed to update stats');
          toast.error('Failed to update donation stats');
        } else {
          const updatedStats = await statsResponse.json();
          toast.success(`Donation successful! You earned ${points} points`);
          
          // Emit donation event for real-time updates
          emitDonationEvent(Number(amount), points, updatedStats);
        }

        // Clear form
        setAmount('');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="number"
          placeholder="Amount in KES"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || !user?.id}
      >
        {loading ? 'Processing...' : user?.id ? 'Donate' : 'Sign in to Donate'}
      </Button>
    </form>
  );
} 