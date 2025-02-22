'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface PaymentFormProps {
  onSuccess: (orderId: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(event.target.value));
  };

  const handlePaymentSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/paypal', { amount });

      setLoading(false);

      if (response.data.success) {
        onSuccess(response.data.orderId);
        router.push(`/Payment-Page?amount=${amount}`);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setLoading(false);
      setError('An error occurred while initiating payment. Please try again later.');
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <label>
        Enter Amount: 
      </label>
      <input type="number" name="amount" value={amount} onChange={handleAmountChange} className='text-black text-xl font-semibold p-2 rounded'/>
      <button onClick={handlePaymentSubmit} disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2">
        {loading ? 'Processing...' : 'Submit Payment'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default PaymentForm;