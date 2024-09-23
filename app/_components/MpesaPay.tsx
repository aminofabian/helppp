'use client'
import React, { useState, useEffect } from 'react';
import { handleMpesa } from '../actions';
import { CreditCard, Phone, Mail, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type PaymentMethod = 'Mpesa' | 'Paystack' | 'PayPal';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

interface SubmitButtonProps {
  ButtonName: string;
  isLoading: boolean;
  onClick: () => void;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ ButtonName, isLoading, onClick }) => {
  return (
    <button
    type="button"
    disabled={isLoading}
    onClick={onClick}
    className={`
        px-6 py-3 font-medium bg-primary text-white w-full
        transition-all duration-300 ease-in-out
        shadow-[3px_3px_0px_orange] hover:shadow-none
        hover:translate-x-[3px] hover:translate-y-[3px]
        rounded-md relative overflow-hidden
        ${isLoading ? 'bg-opacity-70' : ''}
      `}
      >
      <span className={`flex items-center justify-center ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
      {ButtonName}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
        </span>
      )}
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
    const [customAmount, setCustomAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mpesa');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
      if (selectedAmount) {
        setCustomAmount(selectedAmount.toString());
      }
    }, [selectedAmount]);
    
    const handleAmountSelect = (amount: number) => {
      setSelectedAmount(amount);
      setCustomAmount(amount.toString());
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
    
    const handleSubmit = async () => {
      if (!validateForm()) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (paymentMethod === 'Mpesa') {
          const formData = new FormData();
          formData.append('amount', selectedAmount?.toString() || '');
          formData.append('requestId', requestId);
          formData.append('phoneNumber', phoneNumber);
          
          const result = await handleMpesa(formData);
          if (result.success) {
            toast.success('An Mpesa message will appear on your phone. Kindly enter your PIN to complete the payment.', {
              duration: 5000,
              position: 'top-center',
            });
          } else {
            setError(result.message);
          }
        } else if (paymentMethod === 'Paystack') {
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          script.onload = () => {
            const handler = (window as any).PaystackPop.setup({
              key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
              email: email,
              amount: (selectedAmount || 0) * 100,
              currency: 'KES',
              ref: `${Date.now()}`, // Generate a unique reference
              callback: function (response: any) {
                console.log('Payment successful:', response);
                toast.success('Payment successful!');
              },
              onClose: function () {
                console.log('Payment window closed');
                toast.error('Payment cancelled');
              },
            });
            handler.openIframe();
          };
          document.body.appendChild(script);
        } else {
          setError('This payment method is not yet implemented.');
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError('An error occurred during payment. Please try again.');
        toast.error('An error occurred during payment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    return (
      <div className="bg-gradient-to-r from-secondary to-primary p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <Toaster />
      <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Select Amount</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {numbers.map((number, index) => (
        <button
        key={index}
        onClick={() => handleAmountSelect(number)}
        className={`px-4 py-2 text-xs w-fit ${
          selectedAmount === number
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } rounded-lg transition-all`}
        >
        {number}
        </button>
      ))}
      </div>
      <div className="mb-4">
      <input
      type="number"
      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg transition-all focus:ring-2 focus:ring-primary outline-none"
      value={customAmount}
      onChange={handleInputChange}
      placeholder="Enter Custom Amount"
      />
      </div>
      <div className="mb-4 relative">
      <input
      type="tel"
      placeholder="Enter Phone Number"
      name='phoneNumber'
      className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-700 rounded-lg transition-all focus:ring-2 focus:ring-primary outline-none"
      value={phoneNumber}
      onChange={handlePhoneChange}
      />
      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      </div>
      {paymentMethod === 'Paystack' && (
        <div className="mb-4 relative">
        <input
        type="email"
        placeholder="Enter Email Address"
        name='email'
        className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-700 rounded-lg transition-all focus:ring-2 focus:ring-primary outline-none"
        value={email}
        onChange={handleEmailChange}
        />
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      )}
      </div>
      <div className="bg-gradient-to-br from-primary to-purple-200 rounded-lg p-6 flex flex-col justify-center items-center">
      <CreditCard size={48} className="text-white mb-4" />
      <h2 className="text-3xl text-white font-bold mb-2">
      {selectedAmount ? `${selectedAmount}/=` : '0/='}
      </h2>
      <p className="text-sm text-white/80">
      {selectedAmount ? `${selectedAmount / 50} points` : '0 points'}
      </p>
      </div>
      </div>
      <div className='w-full mt-6'>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      
      {paymentMethod === 'Mpesa' || paymentMethod === 'Paystack' ? (
        <SubmitButton 
        ButtonName={`Pay ${selectedAmount || 0}/= With ${paymentMethod}`} 
        isLoading={isLoading}
        onClick={handleSubmit}
        />
      ) : (
        <button 
        className="px-6 py-3 font-medium bg-gray-400 text-white w-full rounded-lg"
        disabled
        >
        {paymentMethod} - Coming Soon
        </button>
      )}
      </div>
      </div>
    );
  };
  
  export default MpesaPay;