'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface WalletDepositFormProps {
  onClose?: () => void;
  onSuccess?: (newBalance: number) => void;
}

export default function WalletDepositForm({ onClose, onSuccess }: WalletDepositFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useKindeBrowserClient();

  const initializePaystack = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsLoading(true);

      const response = await fetch('/api/initialize-paystack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          amount: parseFloat(amount) * 100, // Convert to kobo
          reference: `wallet_deposit_${Date.now()}`,
          callback_url: `${window.location.origin}/wallet/success`, // Redirect to success page
          metadata: {
            type: 'wallet_deposit',
            custom_fields: [
              {
                display_name: "Transaction Type",
                variable_name: "transaction_type",
                value: "wallet_deposit"
              }
            ]
          }
        }),
      });

      const data = await response.json();
      console.log('Paystack initialization response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      // Store the reference in localStorage to verify on return
      localStorage.setItem('paystack_reference', data.reference);

      // Redirect to Paystack checkout URL
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received from Paystack');
      }
    } catch (error) {
      console.error('Failed to initialize Paystack:', error);
      toast.error('Failed to initialize payment');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!user?.email) {
      toast.error('Please log in to continue');
      return;
    }

    initializePaystack();
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-[#0BA4DB] hover:bg-[#0BA4DB]/90"
        >
          {isLoading ? 'Processing...' : 'Pay with Paystack'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        <img 
          src="/Paystack.png" 
          alt="Paystack" 
          className="h-6 w-auto mx-auto mb-2" 
        />
        Secure payments powered by Paystack
      </div>
    </form>
  );
} 