'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface WalletDepositFormProps {
  onSuccess?: (newBalance: number) => void;
  onClose?: () => void;
}

export default function WalletDepositForm({ onSuccess, onClose }: WalletDepositFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useKindeBrowserClient();

  const initializePayment = usePaystackPayment({
    email: user?.email || '',
    amount: parseFloat(amount) * 100, // Convert to kobo/cents
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'KES',
    metadata: {
      type: 'wallet_deposit',
      custom_fields: []
    }
  });

  async function handlePaystackSuccess(reference: any) {
    setLoading(true);
    try {
      // The actual payment processing will be handled by the webhook
      // Here we just show a success message to the user
      toast({
        title: "Payment Initiated!",
        description: "Your payment is being processed. Your wallet will be credited shortly.",
      });

      setAmount('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process deposit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handlePaystackClose() {
    toast({
      title: "Payment Cancelled",
      description: "You have cancelled the payment process.",
      variant: "destructive",
    });
    onClose?.();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please log in to continue",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    // Initialize Paystack payment
    initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (KES)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          required
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-1 gap-2">
          <Button
            type="submit"
            variant="outline"
            className="flex items-center justify-center gap-4 h-20 w-full
              bg-white hover:bg-gray-50 active:bg-gray-100
              border-2 border-gray-200 hover:border-primary/50
              transition-all duration-200 ease-in-out
              rounded-xl shadow-sm hover:shadow-md
              cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:bg-white disabled:hover:shadow-sm"
            disabled={loading || !amount || !user?.email}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <img 
                  src="/Paystack.png" 
                  alt="Paystack" 
                  className="h-8 w-auto transition-transform group-hover:scale-105" 
                />
                <span className="text-base font-medium text-gray-700">
                  Pay {amount ? `KES ${amount}` : ''} with Paystack
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Secure payments powered by Paystack
      </div>
    </form>
  );
} 