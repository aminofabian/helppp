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

  const validateMpesaNumber = (number: string) => {
    // Remove any spaces or special characters
    const cleaned = number.replace(/[^\d]/g, '');
    
    // Check if it starts with 0 and has 10 digits total
    const isValid = /^0\d{9}$/.test(cleaned);
    
    if (!isValid) {
      toast.error('Please enter a valid M-Pesa number (format: 07XXXXXXXX)');
      return false;
    }
    return true;
  };

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
      toast.error('Insufficient wallet balance');
      return;
    }

    if (!validateMpesaNumber(mpesaNumber)) {
      return;
    }

    // Convert 0XXXXXXXXX to 254XXXXXXXXX format for the API
    const apiMpesaNumber = '254' + mpesaNumber.substring(1);

    setIsLoading(true);

    try {
      const response = await fetch('/api/initiate/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
          mpesaNumber: apiMpesaNumber, // Send in 254 format to the API
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient Paystack balance") {
          toast.error('The service is temporarily unavailable. Please try again later.');
        } else {
          throw new Error(data.error || 'Failed to process withdrawal');
        }
        return;
      }

      toast.success('Withdrawal initiated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/[^\d]/g, '');
    
    // Ensure it starts with 0
    if (value && !value.startsWith('0')) {
      setMpesaNumber('0' + value);
    } else {
      setMpesaNumber(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mpesaNumber">M-Pesa Number</Label>
        <Input
          id="mpesaNumber"
          type="text"
          placeholder="07XXXXXXXX"
          value={mpesaNumber}
          onChange={handleMpesaNumberChange}
          maxLength={10}
          required
        />
        <p className="text-xs text-gray-500">Format: 07XXXXXXXX (10 digits)</p>
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