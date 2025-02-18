'use client'
import React, { useState, useEffect } from 'react';
import { handleMpesa, handleTillPayment } from '../actions';
import { CreditCard, Phone, Mail, Loader2, Building2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { stkPushQuery } from '../(actions)/stkPushQuery';
import PaymentSuccess from './Success';
import PayPalButtonWrapper from './PayPalButtonWrapper';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PaystackPop from "@paystack/inline-js";
import dynamic from "next/dynamic";




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
  
  const numbers = [20, 50, 100, 200, 500, 1000, 2000];
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
      console.log(result, "result from handleTillPayment");

      if (result && result.status === 'PENDING') {
        // First toast - STK Push notification
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 pt-0.5">
                  <Phone className="h-10 w-10 text-primary" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Check Your Phone
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    An M-Pesa STK push has been sent to your phone. Please enter your PIN to complete the payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ), {
          duration: 10000,
          position: "top-center",
        });

        // Second toast after delay
        setTimeout(() => {
          toast.loading("Waiting for your payment confirmation...", {
            duration: 5000,
            position: "top-center",
            icon: '⌛',
            style: {
              background: '#4B5563',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
          });
        }, 10000);
      } else {
        toast.error("Failed to initiate payment. Please try again.", {
          duration: 5000,
          position: "top-center",
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    }


    else if (paymentMethod === "Paystack") {
      const initiatePaystackPayment = async () => {
        if (!selectedAmount || !requestId) {
          setError("Please enter a valid amount");
          toast.error("Please enter a valid amount");
          return;
        }

        setIsLoading(true);
        
        try {
          const response = await fetch("/api/initiate", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              amount: selectedAmount,
              requestId: requestId
            }),
            credentials: 'include' // Include credentials for authentication
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            
            if (response.status === 401) {
              toast.error("Please log in to continue");
              window.location.href = "/api/auth/login"; 
              return;
            }
            
            throw new Error(errorData.error || "Failed to initialize payment");
          }
    
          const result = await response.json();
          const authorization_url = result?.data?.data?.authorization_url;
    
          if (!authorization_url) {
            throw new Error("Failed to retrieve authorization URL");
          }
    
          window.location.href = authorization_url;
    
        } catch (error) {
          console.error("Paystack Payment Error:", error);
          const errorMessage = error instanceof Error ? error.message : "An error occurred with Paystack";
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
    
      await initiatePaystackPayment();
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
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
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
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Amount Selection */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 
                               flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gray-800 
                                 flex items-center justify-center text-primary dark:text-blue-400 text-xs">
                      1
                    </span>
                    Choose Amount
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-2">
                    {numbers.map((number) => (
                      <button
                        key={number}
                        onClick={() => handleAmountSelect(number)}
                        className={`
                          relative h-[68px] group overflow-hidden rounded-xl
                          transition-all duration-300 transform hover:scale-[1.02]
                          ${selectedAmount === number 
                            ? 'bg-gradient-to-br from-primary to-primary/90 dark:from-blue-600 dark:to-blue-700'
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80'
                          }
                          ${selectedAmount === number 
                            ? 'shadow-lg ring-1 ring-primary/20 dark:ring-blue-500/20'
                            : 'shadow-sm hover:shadow border border-gray-100 dark:border-gray-700'
                          }
                        `}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 
                                    group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className={`
                              text-base font-semibold leading-none mb-0.5
                              ${selectedAmount === number ? 'text-white' : 'text-gray-700 dark:text-gray-200'}
                            `}>
                              {number.toLocaleString()}
                              <span className={`
                                text-[10px] ml-0.5 font-normal
                                ${selectedAmount === number ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}
                              `}>
                                {paymentMethod === 'PayPal' ? 'USD' : 'KES'}
                              </span>
                            </div>
                            <div className={`
                              text-[9px] font-normal tracking-wide
                              ${selectedAmount === number ? 'text-white/70' : 'text-primary dark:text-blue-400'}
                            `}>
                              {number/50} pts
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 
                               flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-gray-800 
                                 flex items-center justify-center text-primary dark:text-blue-400 text-xs">
                      2
                    </span>
                    Enter Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full h-12 pl-4 pr-16 
                                   bg-gray-50 dark:bg-gray-800 
                                   text-gray-700 dark:text-gray-200 
                                   rounded-xl
                                   focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 
                                   outline-none text-sm
                                   border border-gray-200 dark:border-gray-700 
                                   focus:border-primary/30 dark:focus:border-blue-500/30
                                   transition-all duration-300"
                          value={customAmount}
                          onChange={handleInputChange}
                          placeholder="Enter amount"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 
                                     text-gray-400 dark:text-gray-500 text-sm">
                          KES
                        </span>
                      </div>
                    </div>

                    {(paymentMethod === 'Mpesa' || paymentMethod === 'Till') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {paymentMethod === 'Till' ? 'Phone Number for Till Payment' : 'Phone Number'}
                        </label>
                        <div className="relative">
                          {paymentMethod === 'Till' ? (
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 
                                              text-primary dark:text-blue-400" size={16} />
                          ) : (
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 
                                          text-primary dark:text-blue-400" size={16} />
                          )}
                          <input
                            type="tel"
                            placeholder="Enter your phone number"
                            name='phoneNumber'
                            className="w-full h-12 pl-11 pr-4 
                                   bg-gray-50 dark:bg-gray-800 
                                   text-gray-700 dark:text-gray-200 
                                   rounded-xl
                                   focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 
                                   outline-none text-sm
                                   border border-gray-200 dark:border-gray-700 
                                   focus:border-primary/30 dark:focus:border-blue-500/30
                                   transition-all duration-300"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                          />
                        </div>
                        {paymentMethod === 'Till' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Till Number: {process.env.NEXT_PUBLIC_KOPOKOPO_TILL_NUMBER}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="bg-gradient-to-br from-primary to-primary/90 
                             dark:from-blue-600 dark:to-blue-700
                             rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full 
                                flex items-center justify-center mx-auto mb-4">
                      {paymentMethod === 'Till' ? (
                        <Building2 size={24} className="text-white" />
                      ) : (
                        <CreditCard size={24} className="text-white" />
                      )}
                    </div>
                    <div className="text-3xl text-white font-bold mb-1">
                      {selectedAmount ? selectedAmount.toLocaleString() : '0'}
                      <span className="text-lg ml-1 font-medium opacity-90">KES</span>
                    </div>
                    <p className="text-white/70 text-xs tracking-wide">
                      {selectedAmount ? `${selectedAmount / 50} points` : '0 points'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 
                               p-4 mb-6 rounded-xl">
                    <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {paymentMethod === "PayPal" && clientId ? (
                  <PayPalScriptProvider options={{ clientId }}>
                    <PayPalButtonWrapper
                      requestId={requestId}
                      onPaymentSuccess={(details) => {
                        console.log("Payment Successful:", details);
                        toast.success("Payment was successful!");
                        setShowPayPal(false);
                      }}
                      onPaymentError={(error) => {
                        console.error("Payment Error:", error);
                        toast.error("Payment failed. Please try again.");
                        setShowPayPal(false);
                      }}
                      selectedAmount={selectedAmount || 0}
                      setErrorMessage={setError}
                      errorMessage={error || ""}
                    />
                  </PayPalScriptProvider>
                ) : (paymentMethod === "Mpesa" || paymentMethod === "Till" || paymentMethod === "Paystack") ? (
                  <SubmitButton 
                    ButtonName={`Complete ${paymentMethod} Payment`}
                    isLoading={isLoading}
                    onClick={handleSubmit}
                  />
                ) : (
                  <button 
                    className="w-full py-4 font-medium text-gray-400 dark:text-gray-500 
                             bg-gray-100 dark:bg-gray-800/80 
                             rounded-xl opacity-75 cursor-not-allowed
                             transition-all duration-300"
                    disabled
                  >
                    Select a payment method
                  </button>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  By completing this payment, you agree to our terms of service
                </p>
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