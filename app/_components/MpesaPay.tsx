'use client'
import React, { useState, useEffect } from 'react';
import { handleMpesa, handleTillPayment } from '../actions';
import { CreditCard, Phone, Mail, Loader2, Building2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { stkPushQuery } from '../(actions)/stkPushQuery';
import PaymentSuccess from './Success';
import PayPalButtonWrapper from './PayPalButtonWrapper';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PaystackButton from './PaystackButton';
import dynamic from "next/dynamic";
import PaystackPop from "@paystack/inline-js";




type PaymentMethod = 'Mpesa' | 'Paystack' | 'PayPal' | 'Till';

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
        relative w-full px-6 py-3.5 font-medium text-white
        bg-gradient-to-r from-primary to-primary/90
        dark:from-blue-600 dark:to-blue-700
        rounded-xl overflow-hidden
        transition-all duration-300
        shadow-lg hover:shadow-xl
        transform hover:translate-y-[-2px]
        disabled:opacity-70 disabled:cursor-not-allowed
        disabled:hover:translate-y-0
        group
      `}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300" />
      <span className={`flex items-center justify-center gap-2
                     ${isLoading ? 'opacity-0' : 'opacity-100'} 
                     transition-opacity duration-300`}>
        {ButtonName}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/90" />
        </span>
      )}
    </button>
  );
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selectedMethod, onSelect }) => {
  const methods: PaymentMethod[] = ['Mpesa', 'Till', 'Paystack', 'PayPal'];
  return (
    <div className="flex justify-center space-x-3">
      {methods.map((method) => (
        <button
          key={method}
          onClick={() => onSelect(method)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium
            transition-all duration-300 transform
            ${selectedMethod === method 
              ? 'bg-white/95 text-primary shadow-lg scale-105 dark:bg-gray-800 dark:text-blue-400'
              : 'bg-white/20 text-white hover:bg-white/30 dark:hover:bg-gray-700/50'
            }
            backdrop-blur-sm
            hover:scale-105
          `}
        >
          {method}
        </button>
      ))}
    </div>
  );
};

const MpesaPay = ({ requestId }: { requestId: string }) => {
  
  const numbers = [10, 25, 50, 100, 250, 500, 1000];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mpesa');
  const [isLoading, setIsLoading] = useState(false);
  const [stkQueryLoading, setStkQueryLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showPayPal, setShowPayPal] = useState(false);

  const [clientId, setClientId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchClientId = async () => {
    try {
      const response = await fetch("/api/paypal");
      const data = await response.json();
      if (data.clientId) {
        setClientId(data.clientId);
      } else {
        throw new Error("Client ID not found");
      }
    } catch (error) {
      console.error("Error fetching PayPal client ID:", error);
      toast.error("Failed to load PayPal client ID");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fix: useEffect executes only once
  useEffect(() => {
    fetchClientId();
  }, []);

  // ✅ Fix: Removed unnecessary useEffect
  // ✅ We now update `customAmount` inside event handlers

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

  // const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setEmail(event.target.value);
  //   setError(null);
  // };
  const validateForm = () => {
    if (!selectedAmount || selectedAmount <= 0) {
      setError('Please select a valid amount');
      return false;
    }
    if ((paymentMethod === 'Mpesa' || paymentMethod === 'Till') && (!phoneNumber || !/^(?:254|\+254|0)?([0-9]{9})$/.test(phoneNumber))) {
      setError('Please enter a valid Kenyan phone number');
      return false;
    }
   

    
    return true;
  };

  const stkPushQueryWithIntervals = async (CheckoutRequestID: string) => {
    console.log(CheckoutRequestID, 'are you working')
    const timer = setInterval(async () => {
      const { data, error } = await stkPushQuery(CheckoutRequestID);
      console.log(data, 'hii ndo kitu imekua ikisumbua');

      if (error) {
        if (error.response.data.errorCode !== "500.001.1001") {
          setIsLoading(false);
          toast.error(error?.response?.data?.errorMessage);
        }
      }

      if (data) {
        if (data.ResultCode === "0") {
          clearInterval(timer);
          setIsLoading(false);
          toast.success("An MPesa prompt will appear on your phone. Enter your PIN to complete the payment.", {
            duration: 5000,
            position: "top-center",
          });
        } else {
          clearInterval(timer);
          setIsLoading(false);
          toast.error(data?.ResultDesc);
        }
      }
    }, 2000);
  };



const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsLoading(true);
  setError(null);

  try {
    const createPaymentFormData = () => {
      const formData = new FormData();
      formData.append("amount", selectedAmount?.toString() || "");
      formData.append("requestId", requestId);
      formData.append("phoneNumber", phoneNumber);
      return formData;
    };

    if (paymentMethod === "Mpesa") {
      const result = await handleMpesa(createPaymentFormData());
      console.log(result, "result from handleMpesa");

      if (result.success && result.response.CheckoutRequestID) {
        stkPushQueryWithIntervals(result.response.CheckoutRequestID);
      } else {
        toast.error(result.message || "Failed to initiate payment", {
          duration: 5000,
          position: "top-center",
        });
        setError(result.message || "Failed to initiate payment");
      }
    }

    else if (paymentMethod === "Till") {
      const result = await handleTillPayment(createPaymentFormData());
      console.log('Till payment result:', result);

      if (result?.status === 'PENDING') {
        // Show initial notification
        toast.custom((t) => (
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center">
                <Phone className="h-10 w-10 text-primary flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Payment Initiated
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your payment request has been sent. Please check your phone for the STK push.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ), { duration: 8000 });

        // Start polling for payment status
        const pollInterval = setInterval(async () => {
          try {
            const status = await checkPaymentStatus(result.paymentId);
            if (status === 'SUCCESS') {
              clearInterval(pollInterval);
              setSuccess(true);
              toast.success('Payment successful!');
            } else if (status === 'FAILED') {
              clearInterval(pollInterval);
              toast.error('Payment failed. Please try again.');
              setError('Payment failed');
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        }, 5000); // Poll every 5 seconds

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 120000);
      } else {
        toast.error(result?.message || "Failed to initiate payment");
        setError(result?.message || "Failed to initiate payment");
      }
    }


    else if (paymentMethod === "Paystack") {
      if (!email) {
        setError("Email is required for Paystack payments");
        toast.error("Please enter your email address");
        setIsLoading(false);
        return;
      }

      return (
        <PaystackButton
          email={email}
          amount={selectedAmount || 0}
          requestId={requestId}
          onSuccess={() => {
            setSuccess(true);
            toast.success("Payment successful!");
          }}
          onError={(error) => {
            setError(error);
            toast.error(error);
            setIsLoading(false);
          }}
        />
      );
    }
    

    else {
      setError("This payment method is not yet implemented.");
    }
  } catch (error) {
    console.error("Payment error:", error);
    setError("An error occurred during payment. Please try again.");
    toast.error("An error occurred during payment. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
  

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 8000,
          style: {
            background: '#1F2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          },
        }}
      />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
                      overflow-hidden animate-in slide-in-from-bottom duration-300 
                      max-h-[90vh] overflow-y-auto
                      border border-gray-200/50 dark:border-gray-800/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 dark:from-gray-800 dark:to-gray-900
                        p-5 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <h2 className="text-xl font-bold text-center text-white mb-4 relative z-10">
              Complete Your Payment
            </h2>
            <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            {/* Amount Selection */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 
                           flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gray-800 
                             flex items-center justify-center text-primary dark:text-blue-400 text-xs">
                  1
                </span>
                Choose Amount
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {numbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => handleAmountSelect(number)}
                    className={`
                      relative min-h-[5rem] group overflow-hidden rounded-xl p-3
                      transition-all duration-300
                      aspect-[2/1] w-full
                      flex flex-col items-center justify-center
                      ${selectedAmount === number 
                        ? 'bg-gradient-to-br from-primary to-primary/90 dark:from-blue-600 dark:to-blue-700 scale-100'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:scale-[1.02]'
                      }
                      ${selectedAmount === number 
                        ? 'shadow-lg ring-2 ring-primary/20 dark:ring-blue-500/20'
                        : 'shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700'
                      }
                    `}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 
                                group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`
                        text-lg sm:text-xl font-semibold leading-none
                        ${selectedAmount === number ? 'text-white' : 'text-gray-700 dark:text-gray-200'}
                      `}>
                        {number}
                        <span className={`
                          text-sm ml-1 font-normal
                          ${selectedAmount === number ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}
                        `}>
                          {paymentMethod === 'PayPal' ? 'USD' : 'KES'}
                        </span>
                      </div>
                      <div className={`
                        text-xs font-normal
                        ${selectedAmount === number ? 'text-white/70' : 'text-primary dark:text-blue-400'}
                      `}>
                        {number/50} pts
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="number"
                    className="block w-full pl-4 pr-12 py-3 text-base
                           bg-white dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700
                           rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20
                           focus:border-primary dark:focus:border-blue-500
                           placeholder-gray-400 dark:placeholder-gray-500
                           text-gray-900 dark:text-gray-100"
                    value={customAmount}
                    onChange={handleInputChange}
                    placeholder="Or enter custom amount"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">
                      {paymentMethod === 'PayPal' ? 'USD' : 'KES'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="space-y-6">
              {/* Phone Number Input */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 
                           flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gray-800 
                               flex items-center justify-center text-primary dark:text-blue-400 text-xs">
                    2
                  </span>
                  Enter Phone Number
                </h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="block w-full pl-10 pr-3 py-3 text-base
                           bg-white dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700
                           rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20
                           focus:border-primary dark:focus:border-blue-500
                           placeholder-gray-400 dark:placeholder-gray-500
                           text-gray-900 dark:text-gray-100"
                    placeholder="Enter your M-Pesa number"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 
                           flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gray-800 
                               flex items-center justify-center text-primary dark:text-blue-400 text-xs">
                    3
                  </span>
                  Enter Email
                </h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 text-base
                           bg-white dark:bg-gray-800 
                           border border-gray-200 dark:border-gray-700
                           rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20
                           focus:border-primary dark:focus:border-blue-500
                           placeholder-gray-400 dark:placeholder-gray-500
                           text-gray-900 dark:text-gray-100"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <SubmitButton
                ButtonName={`Pay ${selectedAmount || customAmount || 0} ${paymentMethod === 'PayPal' ? 'USD' : 'KES'}`}
                isLoading={isLoading}
                onClick={handleSubmit}
              />

              {/* Points Display */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                You will receive {(Number(selectedAmount || customAmount || 0) / 50).toFixed(1)} points
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MpesaPay;

<style jsx>{`
  .bg-grid-pattern {
    background-image: linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
    background-size: 8px 8px;
  }
`}</style>