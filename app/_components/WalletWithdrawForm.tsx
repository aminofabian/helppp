import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface WalletWithdrawFormProps {
  onClose: () => void;
  walletBalance: number;
}

export default function WalletWithdrawForm({ onClose, walletBalance }: WalletWithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !mpesaNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (numAmount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/initiate/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
          mpesaNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      toast.success('Withdrawal initiated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mpesaNumber">M-Pesa Number</Label>
        <Input
          id="mpesaNumber"
          type="text"
          placeholder="254700000000"
          value={mpesaNumber}
          onChange={(e) => setMpesaNumber(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (KES)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          max={walletBalance}
          required
        />
        <p className="text-sm text-gray-500">Available balance: KES {walletBalance.toLocaleString()}</p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Withdraw'}
        </Button>
      </div>
    </form>
  );
} 