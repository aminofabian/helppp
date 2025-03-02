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
  isDepositWallet?: boolean;
}

export default function WalletDepositForm({ onClose, onSuccess, isDepositWallet = false }: WalletDepositFormProps) {
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
          amount: parseFloat(amount),
          reference: `${isDepositWallet ? 'deposit' : 'wallet'}_${Date.now()}`,
          transactionType: 'donation',
          callback_url: `${window.location.origin}/${isDepositWallet ? 'deposit' : 'wallet'}/success`,
          channels: ['card', 'mobile_money'],
          metadata: {
            type: 'deposit',
            // type: isDepositWallet ? 'deposit' : 'wallet_deposit',
            custom_fields: [
              {
                display_name: "Transaction Type",
                variable_name: "transaction_type",
                value: isDepositWallet ? "deposit" : "wallet_deposit"
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

      // Store the reference and type in localStorage to verify on return
      localStorage.setItem('paystack_reference', data.reference);
      localStorage.setItem('transaction_type', isDepositWallet ? 'deposit' : 'wallet');

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

      {isDepositWallet && (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">⚠️ Note: Funds deposited to this wallet:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Can only be used for donations</li>
            <li>Cannot be withdrawn</li>
            <li>Will be used exclusively for helping others</li>
          </ul>
        </div>
      )}

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