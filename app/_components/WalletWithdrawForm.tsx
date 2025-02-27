import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

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
    // Send SMS notification for withdrawal request
    try {
      // Format messages with proper templates
      const adminMessage = `Withdrawal Request Alert:\nUser: ${user?.given_name || 'Unknown'}\nAmount: KES ${parseFloat(amount).toLocaleString()}\nM-Pesa: ${mpesaNumber}\nTime: ${new Date().toLocaleString()}`;
      
      const userMessage = `Dear ${user?.given_name || 'User'},\n\nYour withdrawal request of KES ${parseFloat(amount).toLocaleString()} is being processed.\n\nFor support:\nWhatsApp/SMS/Call: 0714282874\n\nThank you for using our service!`;

      // Send notification to admin with proper error handling
      const adminSmsResponse = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: process.env.NEXT_PUBLIC_SMS_API_KEY,
          partnerID: process.env.NEXT_PUBLIC_SMS_PARTNER_ID,
          message: adminMessage,
          shortcode: process.env.NEXT_PUBLIC_SMS_SENDER_ID,
          mobile: '254714282874'
        })
      });

      if (!adminSmsResponse.ok) {
        console.error('Failed to send admin notification:', await adminSmsResponse.text());
      }

      // Send confirmation SMS to user with proper error handling
      const userSmsResponse = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: process.env.NEXT_PUBLIC_SMS_API_KEY,
          partnerID: process.env.NEXT_PUBLIC_SMS_PARTNER_ID,
          message: userMessage,
          shortcode: process.env.NEXT_PUBLIC_SMS_SENDER_ID,
          mobile: mpesaNumber.replace(/^0/, '254')
        })
      });

      if (!userSmsResponse.ok) {
        console.error('Failed to send user notification:', await userSmsResponse.text());
      }
    } catch (error) {
      console.error('Failed to send SMS notifications:', error);
      // Show a warning toast but continue with withdrawal process
      toast.warning('SMS notification might be delayed', {
        description: 'Your withdrawal will still be processed'
      });
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