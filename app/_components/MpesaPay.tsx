'use client'
import React, { useState, useEffect } from 'react';
import { handleMpesa } from '../actions';
import { useFormStatus } from 'react-dom';

type PaymentMethod = 'Mpesa' | 'Paystack' | 'PayPal';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const SubmitButton = ({ ButtonName }: { ButtonName: string }) => {
  const { pending } = useFormStatus();
  return (
    <button
    type="submit"
    disabled={pending}
    className="px-6 py-2 font-medium bg-primary text-white w-full transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md"
    >
    {pending ? 'Processing...' : ButtonName}
    </button>
  );
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selectedMethod, onSelect }) => {
  const methods: PaymentMethod[] = ['Mpesa', 'Paystack', 'PayPal'];
  return (
    <div className="flex justify-center space-x-4 mb-6">
    {methods.map((method) => (
      <button
      key={method}
      onClick={() => onSelect(method)}
      className={`px-4 py-2 rounded-full transition-all ${
        selectedMethod === method
        ? 'bg-primary text-white shadow-lg'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      >
      {method}
      </button>
    ))}
    </div>
  );
};

const MpesaPay = ({ requestId }: { requestId: string }) => {
  const numbers = [20, 50, 100, 200, 500, 1000, 2000];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Mpesa');
  
  useEffect(() => {
    if (selectedAmount) {
      setCustomAmount(selectedAmount.toString());
    }
  }, [selectedAmount]);
  
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
    setError(null);
    setEditMode(false);
  };
  
  const handleEditClick = () => {
    setEditMode(true);
    setError(null);
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomAmount(value);
    setSelectedAmount(parseInt(value) || null);
    setError(null);
  };
  
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
    setError(null);
  };
  
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setError(null);
  };
  
  const validateForm = () => {
    if (!selectedAmount || selectedAmount <= 0) {
      setError('Please select a valid amount');
      return false;
    }
    if (paymentMethod === 'Mpesa' && (!phoneNumber || !/^(?:254|\+254|0)?([0-9]{9})$/.test(phoneNumber))) {
      setError('Please enter a valid Kenyan phone number');
      return false;
    }
    if (paymentMethod === 'Paystack' && (!email || !/\S+@\S+\.\S+/.test(email))) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    if (paymentMethod === 'Mpesa') {
      const formData = new FormData();
      formData.append('amount', selectedAmount?.toString() || '');
      formData.append('requestId', requestId);
      formData.append('phoneNumber', phoneNumber);
      
      try {
        const result = await handleMpesa(formData);
        if (result.success) {
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError('An error occurred while processing the payment.');
      }
    } else if (paymentMethod === 'Paystack') {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
          email: email,
          amount: (selectedAmount || 0) * 100,
          currency: 'KES',
          callback: function (response: any) {
          },
          onClose: function () {
          }
        });
        handler.openIframe();
      };
      document.body.appendChild(script);
    } else {
    }
  };
  
  return (
    <div className="bg-gradient-to-r from-secondary to-primary p-6 rounded-lg shadow-lg">
    <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
    
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] lg:gap-8">
    <div className="h-fit rounded-lg bg-white shadow-md p-4">
    <div className="grid grid-cols-3 md:grid-cols-4 gap-5 justify-between">
    {numbers.map((number, index) => (
      <button
      key={index}
      onClick={() => handleAmountSelect(number)}
      className="px-4 py-2 bg-primary text-white rounded-full transition-all hover:bg-secondary hover:shadow-md"
      >
      {number}
      </button>
    ))}
    </div>
    <div className="mt-4">
    <button onClick={handleEditClick} className="w-full px-4 py-2 bg-primary text-white rounded-full transition-all hover:bg-orange-500 hover:shadow-md">
    Add a Custom Amount
    </button>
    </div>
    <div className="mt-4">
    <input
    type="number"
    className="w-full px-6 py-2 font-medium bg-gray-100 text-gray-700 rounded-full transition-all focus:ring-2 focus:ring-secondary outline-none"
    value={customAmount}
    onChange={handleInputChange}
    placeholder="Enter Custom Amount"
    />
    </div>
    <div className="mt-4">
    <input
    type="tel"
    placeholder="Enter Phone Number"
    name='phoneNumber'
    className="w-full px-6 py-2 font-medium bg-gray-100 text-gray-700 rounded-full transition-all focus:ring-2 focus:ring-secondary outline-none"
    value={phoneNumber}
    onChange={handlePhoneChange}
    />
    </div>
    {paymentMethod === 'Paystack' && (
      <div className="mt-4">
      <input
      type="email"
      placeholder="Enter Email Address"
      name='email'
      className="w-full px-6 py-2 font-medium bg-gray-100 text-gray-700 rounded-full transition-all focus:ring-2 focus:ring-secondary outline-none"
      value={email}
      onChange={handleEmailChange}
      />
      </div>
    )}
    </div>
    <div className="h-fit rounded-lg bg-gradient-to-br from-primary to-purple-200 w-full p-4">
    <div className="container h-full flex flex-col justify-center items-center">
    <h2 className="text-2xl text-primary border border-secondary font-semibold justify-center items-center my-3 px-3 py-1 rounded-full">
    {selectedAmount ? `${selectedAmount}/=` : '0/='}
    </h2>
    <p className="text-sm text-secondary mt-2">
    {selectedAmount ? `${selectedAmount / 50} points` : '0 points'}
    </p>
    </div>
    </div>
    </div>
    <form onSubmit={handleSubmit} className='w-full my-5 flex flex-col'>
    {error && <p className="text-red-500 mb-2">{error}</p>}
    
    {paymentMethod === 'Mpesa' ? (
      <SubmitButton ButtonName={`Pay ${selectedAmount || 0}/= With Mpesa`} />
    ) : paymentMethod === 'Paystack' ? (
      <SubmitButton ButtonName={`Pay ${selectedAmount || 0}/= With Paystack`} />
    ) : (
      <button 
      className="px-6 py-2 font-medium bg-gray-400 text-white w-full rounded-md"
      disabled
      >
      {paymentMethod} - Coming Soon
      </button>
    )}
    </form>
    </div>
  );
};

export default MpesaPay;
