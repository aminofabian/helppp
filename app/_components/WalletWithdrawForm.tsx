import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

interface WalletWithdrawFormProps {
  onClose: () => void;
  walletBalance: number;
}

export default function WalletWithdrawForm({ onClose, walletBalance }: WalletWithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useKindeBrowserClient();

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

    // Send SMS notifications for withdrawal request
    try {
      // Send notifications to both admin and user
      await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          mobile: mpesaNumber,
          userName: user?.given_name || 'Unknown',
          mpesaNumber: mpesaNumber,
          isSuccessful: false // Initial status is pending
        })
      });

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
            userName: user?.given_name || 'Unknown'
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          if (data.code === "TRANSFERS_NOT_ENABLED") {
            toast.error('Payment service error', {
              description: data.error || 'Transfers not enabled'
            });
          } else if (data.error === "Insufficient Paystack balance") {
            toast.error('Payment service error', {
              description: data.error
            });
          } else {
            toast.error('Payment service error', {
              description: data.error || 'Failed to process withdrawal'
            });
          }
          return;
        }

        // Send success SMS after successful withdrawal
        await fetch('/api/sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: numAmount,
            mobile: mpesaNumber,
            userName: user?.given_name || 'Unknown',
            mpesaNumber: mpesaNumber,
            isSuccessful: true // Update status to successful
          })
        });

        toast.success('Withdrawal Successful', {
          description: `KES ${numAmount.toLocaleString()} has been sent to M-Pesa number ${mpesaNumber}. The transaction will be processed shortly.`
        });

        onClose();
      } catch (error: any) {
        toast.error('Payment service error', {
          description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    } catch (error:any){
      toast.error('Failed to send notification', {
        description: 'The withdrawal request was not processed. Please try again.'
      });
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
    <Card className="w-full max-w-md mx-auto p-6 shadow-lg rounded-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-center mb-2">Withdraw Funds</h2>
        <p className="text-center text-muted-foreground">
          Available balance: <span className="font-medium text-primary">KES {walletBalance.toLocaleString()}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mpesaNumber" className="text-sm font-medium">M-Pesa Number</Label>
          <div className="relative">
            <Input
              id="mpesaNumber"
              type="text"
              placeholder="07XXXXXXXX"
              value={mpesaNumber}
              onChange={handleMpesaNumberChange}
              maxLength={10}
              required
              className="pl-10 transition-all duration-200 border-input hover:border-primary"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icons.phone className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Format: 07XXXXXXXX (10 digits)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">Amount (KES)</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={walletBalance}
              required
              className="pl-10 transition-all duration-200 border-input hover:border-primary"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icons.wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Min: KES 1</p>
            <p className="text-xs text-muted-foreground">Max: KES {walletBalance.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Withdraw
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
