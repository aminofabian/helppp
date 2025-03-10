'use client';

import React, { useState, useEffect } from 'react';
import { handleTillPayment } from '../actions';
import { Phone, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { stkPushQuery } from '../(actions)/stkPushQuery';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PayPalButtonWrapper from './PayPalButtonWrapper';

type PaymentMethod = 'Mpesa' | 'Paystack' | 'PayPal' | 'Till';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onMethodChange: (method: PaymentMethod) => void;
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

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
  selectedMethod, 
  onSelect,
  onMethodChange 
}) => {
  const methods: PaymentMethod[] = ['Mpesa', 'Paystack', 'PayPal'];
  
  const handleMethodSelect = (method: PaymentMethod) => {
    onSelect(method);
    onMethodChange(method);
    toast.success(`${method} selected as payment method`, {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
  };

  return (
    <div className="flex justify-center space-x-3">
      {methods.map((method) => (
        <button
          key={method}
          onClick={() => handleMethodSelect(method)}
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
  const { user, isLoading: isAuthLoading } = useKindeBrowserClient();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Paystack');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPaystackButton, setShowPaystackButton] = useState(false);
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

  useEffect(() => {
    fetchClientId();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-white/90" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white/10 backdrop-blur-sm rounded-2xl">
        <h2 className="text-xl font-semibold text-white text-center">Support insoluble-souff</h2>
        <p className="text-white/80 text-center">
          Your contribution will help insoluble-souff reach their goal of KES 2,008/=
        </p>
        <LoginLink 
          className="px-6 py-3 font-medium text-white bg-gradient-to-r from-primary to-primary/90 rounded-xl 
                   hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px]
                   flex items-center justify-center gap-2"
        >
          <span>Sign in to help</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        </LoginLink>
      </div>
    );
  }

  const numbers = [10, 25, 50, 100, 250, 500, 1000];

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

  const handleSuccess = () => {
    toast.success('Payment successful! Thank you for your contribution.', {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#10B981',
        color: '#fff',
      },
      icon: '🎉',
    });
  }
  const onPaymentSuccess = (orderId: string) => {
    handleSuccess();
  };

  const onPaymentError = (error: string) => {
    handleError(error);
  };

  const setErrorMessage = (error: string) => {
    setError(error);
  };

 

  const validateForm = () => {
    if (!selectedAmount || selectedAmount <= 0) {
      setError('Please select a valid amount');
      return false;
    }

    // Phone number only required for Mpesa and Till payments
    if ((paymentMethod === 'Mpesa' || paymentMethod === 'Till') && 
        (!phoneNumber || !/^(?:254|\+254|0)?([0-9]{9})$/.test(phoneNumber))) {
      setError('Please enter a valid Kenyan phone number');
      return false;
    }

    // Email validation not needed for Paystack as we use Kinde user email
    if (paymentMethod === 'PayPal' && !user?.email) {
      setError('Email is required for PayPal payments');
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

  // Function to check payment status
  const checkPaymentStatus = async (paymentId: string): Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING', isCompleted: boolean }> => {
    try {
      const response = await fetch(`/api/check-till-payment?paymentId=${paymentId}`);
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      const data = await response.json();
      return {
        status: data.status,
        isCompleted: data.isCompleted || false
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { status: 'FAILED', isCompleted: true };
    }
  };

  // Function to handle Till payment polling
  const pollPaymentStatus = async (paymentId?: string) => {
    if (!paymentId) {
      console.error("❌ Missing paymentId for polling.");
      return;
    }
  
    let pollCount = 0;
    const maxPolls = 24; // 2 minutes with 5-second intervals
    let isProcessing = false; // Add state to prevent concurrent processing
    let pollInterval: NodeJS.Timeout;
  
    const checkStatus = async () => {
      try {
        if (isProcessing) return; // Skip if already processing
        isProcessing = true;
        pollCount++;
        
        const { status, isCompleted } = await checkPaymentStatus(paymentId);
  
        // If payment is completed (success or failed) or max polls reached
        if (isCompleted || pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIsLoading(false);

          if (status === "SUCCESS") {
            setSuccess(true);
            toast.success("✅ Payment successful!");
            setError(null);
          } else if (status === "FAILED") {
            toast.error("❌ Payment failed. Please try again.");
            setError("Payment failed");
          } else if (pollCount >= maxPolls) {
            toast.error("⏳ Payment timeout. Please try again.");
            setError("Payment timeout");
          }
        }
      } catch (error) {
        console.error("⚠️ Error checking payment status:", error);
      } finally {
        isProcessing = false;
      }
    };

    // Start polling
    pollInterval = setInterval(checkStatus, 5000);

    // Cleanup function to prevent memory leaks
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setIsLoading(false);
      }
    };
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
        const result = await handleTillPayment(createPaymentFormData());
        console.log("📡 Mpesa payment result:", result);
      
        if (result?.success) {
          toast.custom((t) => (
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
              <div className="flex-1 w-0 p-4">
                <div className="flex items-center">
                  <Phone className="h-10 w-10 text-primary flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Payment Initiated</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Your payment request has been sent. Please check your phone for the STK push.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 8000 });
      
          if (result.paymentId) {
            await pollPaymentStatus(result.paymentId);
          } else {
            console.error("❌ No paymentId returned from handleTillPayment.");
          }
        } else {
          toast.error(result?.message || "❌ Failed to initiate payment.");
          setError(result?.message || "❌ Failed to initiate payment.");
        }
        setIsLoading(false);
      }
      
      else if (paymentMethod === "Paystack") {
        setShowPaystackButton(true);
        setIsLoading(false);
      }

      else {
        setError("This payment method is not yet implemented.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError("An error occurred during payment. Please try again.");
      toast.error("An error occurred during payment. Please try again.");
      setIsLoading(false);
    }
  };
  
  

  const handleError = (error: string) => {
    toast.error(`Payment failed: ${error}`, {
      duration: 4000,
      position: 'top-center',
    });
  };

  const handleProcessing = () => {
    toast.loading('Processing your payment...', {
      duration: 2000,
      position: 'top-center',
    });
  };

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
          amount: parseFloat(customAmount),
          transactionType: 'donation',
          reference: `${requestId}_${Date.now()}`,
          callback_url: `${window.location.origin}/api/paystack-callback`,
          metadata: {
            request_id: requestId,
            type: 'donation',
            custom_fields: [
              {
                display_name: "Request ID",
                variable_name: "request_id",
                value: requestId
              }
            ]
          }
        }),
      });
      

      const data = await response.json();
      console.log('Paystack initialization response:', data);

      if (!response.ok) {
        console.error('Paystack initialization failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || 'Failed to initialize payment');
      }

      if (data.redirect_url) {
        toast.success(data.message);
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 2000); // Redirect after 2 seconds
        return;
      }

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Toaster />
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
          <PaymentMethodSelector 
            selectedMethod={paymentMethod} 
            onSelect={setPaymentMethod} 
            onMethodChange={(method) => {
              setShowPaystackButton(false);
              setError(null);
              if (method === 'Paystack' || method === 'PayPal') {
                setPhoneNumber('');
              } else {
                setEmail('');
              }
            }} 
          />
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
            {/* Phone Number Input - Only show for Mpesa and Till */}
            {(paymentMethod === 'Mpesa' || paymentMethod === 'Till') && (
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
            )}

            {/* Email Input - Only show for PayPal */}
            {/* {paymentMethod === 'PayPal' && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 
                             flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gray-800 
                               flex items-center justify-center text-primary dark:text-blue-400 text-xs">
                    2
                  </span>
                  Enter Email Address
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
            )} */}
            {/* Payment Button */}

<PayPalScriptProvider options={{ clientId }}>

            <div className="mt-8">
  {paymentMethod === 'PayPal' ? (
    <PayPalButtonWrapper
      requestId={requestId}
      onPaymentSuccess={onPaymentSuccess}
      onPaymentError={onPaymentError}
      selectedAmount={selectedAmount || parseFloat(customAmount)}
      setErrorMessage={setErrorMessage}
      errorMessage={error || ''}
    />
  ) : paymentMethod === 'Paystack' && selectedAmount ? (
    <SubmitButton
      ButtonName={`Pay ${selectedAmount || customAmount} KES with Paystack`}
      isLoading={isLoading}
      onClick={initializePaystack}
    />
  ) : (
    <SubmitButton
      ButtonName={`Pay ${selectedAmount || customAmount} KES`}
      isLoading={isLoading}
      onClick={handleSubmit}
    />
  )}
</div>
</PayPalScriptProvider>

            {/* <div className="mt-8">
              {paymentMethod === 'Paystack' && selectedAmount ? (
                <SubmitButton
                  ButtonName={`Pay ${selectedAmount || customAmount} KES with Paystack`}
                  isLoading={isLoading}
                  onClick={initializePaystack}
                />
              ) : (paymentMethod !== 'Paystack' && (
                <SubmitButton
                  ButtonName={`Pay ${selectedAmount || customAmount} ${paymentMethod === 'PayPal' ? 'USD' : 'KES'}`}
                  isLoading={isLoading}
                  onClick={handleSubmit}
                />
              ))}
            </div> */}
          </div>
        </div>
      </div>
    </div>
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