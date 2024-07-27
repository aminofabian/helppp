'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { useToast } from "@/components/ui/use-toast";
import { CloudLightning } from 'lucide-react';

type B2CPaymentFormProps = {
  amountValue: number;
};

const B2CPaymentForm: React.FC<B2CPaymentFormProps> = ({ amountValue }) => {  
  
  const { toast } = useToast()
  
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/b2c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: customAmount,
          phoneNumber,
        }),
      });
      
      const data = await response.json();
      console.log(data);
      // Handle the response (e.g., show success message)
    } catch (error) {
      console.error('Error:', error);
      // Handle the error (e.g., show error message)
    } finally {
      setLoading(false);
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCustomAmount(e.target.value);
    if (value > amountValue) {
      setShowWarning(true);
      toast({
        variant:'destructive',
        title: `The Amount Shouldn't exceed ${amountValue}`,
        description: `Oops!!! You cannot withdraw more than what's been contributed. Please enter an amount lower than ${amountValue}`,
      })
    } else {
      setShowWarning(false);
    }
  };
  
  return (
    <Card className="p-6">
    <form onSubmit={handleSubmit}>
    <div className="space-y-4">
    <div>
    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 text-md">
    You're About to Withdraw
    </label>
    <h2 className="py-2 dark:bg-gray-50 dark:text-gray-800 flex w-full justify-end">
    <span className='font-bold text-lg border border-green-100 rounded-lg px-5 py-2 my-5 bg-green-100 text-primary'>
    <span className='text-sm mr-1 font-semibold hover:animate-out cursor-pointer my-5'>KES</span>{amountValue}
    </span>
    </h2>
    <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700">
    Enter Custom Amount (up to {amountValue} KES)
    </label>
    <Input
    type="number"
    id="customAmount"
    value={customAmount}
    onChange={handleAmountChange}
    required
    placeholder="Enter amount"
    />
    {showWarning && (
      <p className="mt-1 text-sm text-red-500">
      <CloudLightning />Oops!!! You cannot withdraw more than what's been contributed. Please enter an amount lower than {amountValue}
      </p>
    )}
    </div>
    <div>
    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
    Phone Number
    </label>
    <Input
    type="tel"
    id="phoneNumber"
    value={phoneNumber}
    onChange={(e) => setPhoneNumber(e.target.value)}
    required
    placeholder="Enter phone number"
    />
    </div>
    <Button type="submit" disabled={loading || showWarning}>
    {loading ? 'Processing...' : 'Withdraw'}
    </Button>
    </div>
    </form>
    </Card>
  );
};

export default B2CPaymentForm;