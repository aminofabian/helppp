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
  const methods: PaymentMethod[] = ['Mpesa', 'Till', 'Paystack', 'PayPal'];
  return (
    <div className="flex justify-center space-x-4 mb-6">
      {methods.map((method) => (
        <button
          key={method}
          onClick={() => onSelect(method)}
          className={`px-4 py-2 rounded-full transition-all ${selectedMethod === method
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
        toast.success("Payment initiated successfully. Please check your phone to complete the transaction.", {
          duration: 5000,
          position: "top-center",
        });
      } else {
        toast.error("Failed to initiate payment", {
          duration: 5000,
          position: "top-center",
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

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header - Made more compact */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <h2 className="text-xl font-bold text-center text-white mb-3">
            Complete Your Payment
          </h2>
          <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />
        </div>

        <div className="p-4">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Amount Selection */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">1</span>
                  Choose Amount
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {numbers.map((number) => (
                    <button
                      key={number}
                      onClick={() => handleAmountSelect(number)}
                      className={`
                        relative h-[68px] group
                        ${selectedAmount === number 
                          ? 'bg-gradient-to-br from-primary to-secondary'
                          : 'bg-white hover:bg-gray-50'
                        }
                        rounded-xl transition-all duration-300
                        overflow-hidden
                        ${selectedAmount === number 
                          ? 'shadow-md ring-1 ring-primary'
                          : 'shadow-sm hover:shadow border border-gray-100'
                        }
                      `}
                    >
                      {/* Decorative Elements - Made smaller */}
                      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                      <div className={`
                        absolute top-0 left-0 w-full h-0.5
                        ${selectedAmount === number ? 'bg-white/20' : 'bg-primary/10'}
                      `} />
                      
                      {/* Content Container */}
                      <div className="relative h-full flex items-center justify-center">
                        {/* Left Circle Decoration */}
                        <div className={`
                          absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full
                          ${selectedAmount === number ? 'bg-white/40' : 'bg-primary/20'}
                        `} />
                        
                        {/* Main Content - Reduced font sizes */}
                        <div className="text-center px-2">
                          <div className={`
                            text-base font-bold leading-none mb-1
                            ${selectedAmount === number ? 'text-white' : 'text-gray-700'}
                          `}>
                            {number.toLocaleString()}
                            <span className={`
                              text-xs ml-0.5 font-medium
                              ${selectedAmount === number ? 'text-white/70' : 'text-gray-400'}
                            `}>
                              {paymentMethod === 'PayPal' ? 'USD' : 'UD'}
                            </span>
                          </div>
                          <div className={`
                            text-[9px] font-medium leading-none
                            ${selectedAmount === number ? 'text-white/70' : 'text-primary'}
                          `}>
                            {number/50} pts
                          </div>
                        </div>

                        {/* Right Circle Decoration */}
                        <div className={`
                          absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full
                          ${selectedAmount === number ? 'bg-white/40' : 'bg-primary/20'}
                        `} />
                      </div>

                      {/* Bottom Line Decoration */}
                      <div className={`
                        absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full
                        ${selectedAmount === number ? 'bg-white/20' : 'bg-primary/10'}
                      `} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">2</span>
                  Enter Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full h-11 pl-4 pr-16 bg-gray-50 text-gray-700 rounded-lg
                                  focus:ring-2 focus:ring-primary/20 outline-none text-sm
                                  border border-gray-200 focus:border-primary/30"
                        value={customAmount}
                        onChange={handleInputChange}
                        placeholder="Enter amount"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        KES
                      </span>
                    </div>
                  </div>

                  {(paymentMethod === 'Mpesa' || paymentMethod === 'Till') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">
                        {paymentMethod === 'Till' ? 'Phone Number for Till Payment' : 'Phone Number'}
                      </label>
                      <div className="relative">
                        {paymentMethod === 'Till' ? (
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        ) : (
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        )}
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          name='phoneNumber'
                          className="w-full h-11 pl-11 pr-4 bg-gray-50 text-gray-700 rounded-lg
                                    focus:ring-2 focus:ring-primary/20 outline-none text-sm
                                    border border-gray-200 focus:border-primary/30"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                        />
                      </div>
                      {paymentMethod === 'Till' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Till Number: {process.env.NEXT_PUBLIC_KOPOKOPO_TILL_NUMBER}
                        </p>
                      )}
                    </div>
                  )}

                  {/* {paymentMethod === 'Paystack' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Addressses</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          name='email'
                          className="w-full h-11 pl-11 pr-4 bg-gray-50 text-gray-700 rounded-lg
                                    focus:ring-2 focus:ring-primary/20 outline-none text-sm
                                    border border-gray-200 focus:border-primary/30"
                          value={email}
                          onChange={handleEmailChange}
                        /> 
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            </div>

            {/* Right Column - Made more compact */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    {paymentMethod === 'Till' ? (
                      <Building2 size={24} className="text-white" />
                    ) : (
                      <CreditCard size={24} className="text-white" />
                    )}
                  </div>
                  <div className="text-3xl text-white font-bold mb-1">
                    {selectedAmount ? selectedAmount.toLocaleString() : '0'}
                    <span className="text-xl ml-1">KES</span>
                  </div>
                  <p className="text-white/80 text-sm">
                    {selectedAmount ? `${selectedAmount / 50} points` : '0 points'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

{paymentMethod === "PayPal" && clientId ? (
  <PayPalScriptProvider options={{ clientId }}>

  <PayPalButtonWrapper
    requestId={requestId}
    onPaymentSuccess={(details) => {
      console.log("Payment Successful:", details);
      toast.success("Payment was successful!");
      setShowPayPal(false); // Hide PayPal button after successful payment
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
    className="w-full py-4 font-bold bg-gray-400 text-white rounded-xl opacity-75 cursor-not-allowed"
    disabled
  >
    Select a payment method
  </button>
)}



{/* {paymentMethod === "PayPal" && clientId ? (
  <PayPalScriptProvider options={{ clientId }}>
    <PayPalButtonWrapper
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
) : (
  <p>Loading PayPal...</p>
)} */}



              {/* {(paymentMethod === 'Mpesa' || paymentMethod === 'Till' || paymentMethod === 'Paystack' || paymentMethod === 'PayPal') ? (
                <SubmitButton 
                  ButtonName={`Complete ${paymentMethod} Payment`}
                  isLoading={isLoading}
                  onClick={handleSubmit}
                />
              ) : (
                <button 
                  className="w-full py-4 font-bold bg-gray-400 text-white rounded-xl
                           opacity-75 cursor-not-allowed"
                  disabled
                >
                  
                 

               
    

                </button>
              )} */}

              <p className="text-xs text-gray-500 text-center mt-4">
                By completing this payment, you agree to our terms of service
              </p>
            </div>
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























  // const handleSubmit = async () => {
  //   if (!validateForm()) return;
  
  //   setIsLoading(true);
  //   setError(null);
  
  //   try {
  //     const createPaymentFormData = () => {
  //       const formData = new FormData();
  //       formData.append("amount", selectedAmount?.toString() || "");
  //       formData.append("requestId", requestId);
  //       formData.append("phoneNumber", phoneNumber);
  //       return formData;
  //     };
  
  //     if (paymentMethod === "Mpesa") {
  //       const result = await handleMpesa(createPaymentFormData());
  //       console.log(result, "result from handleMpesa");
  
  //       if (result.success && result.response.CheckoutRequestID) {
  //         stkPushQueryWithIntervals(result.response.CheckoutRequestID);
  //       } else {
  //         toast.error(result.message || "Failed to initiate payment", { duration: 5000, position: "top-center" });
  //         setError(result.message || "Failed to initiate payment");
  //       }
  //     } 
      
  //     else if (paymentMethod === "Till") {
  //       const result = await handleTillPayment(createPaymentFormData());
  //       console.log(result, "result from handleTillPayment");
  
  //       if (result.success) {
  //         toast.success("Payment initiated successfully. Please check your phone to complete the transaction.", {
  //           duration: 5000, position: "top-center",
  //         });
  //       } else {
  //         toast.error(result.message || "Failed to initiate payment", { duration: 5000, position: "top-center" });
  //         setError(result.message || "Failed to initiate payment");
  //       }
  //     } 
      
  //     else if (paymentMethod === "Paystack") {
  //       const initiatePaystackPayment = async () => {
  //         const response = await fetch("/api/paystack/initiate", {
  //           method: "POST",
  //           body: JSON.stringify({ email: "tobiasbarakan@gmail.com", amount: 1 }),
  //           headers: { "Content-Type": "application/json" },
  //         });
  
  //         const { access_code } = await response.json();
  //         console.log(access_code, "Access Code from Paystack");
  
  //         const paystack = new PaystackPop();
  //         paystack.newTransaction({
  //           key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  //           email: "tobiasbarakan@gmail.com",
  //           amount: 1 * 100, // Convert to kobo
  //           onSuccess: (response) => {
  //             console.log("Transaction Successful:", response);
  //             toast.success("Payment successful!");
  //           },
  //           onCancel: () => {
  //             console.error("Transaction cancelled");
  //             toast.error("Payment cancelled!");
  //           },
  //         });
  //       };
  
  //       await initiatePaystackPayment();
  //     } 
      
  //     else {
  //       setError("This payment method is not yet implemented.");
  //     }
  //   } catch (error) {
  //     console.error("Payment error:", error);
  //     setError("An error occurred during payment. Please try again.");
  //     toast.error("An error occurred during payment. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  
  
  // const handleSubmit = async () => {
  //   if (!validateForm()) return;

  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     if (paymentMethod === "Mpesa") {
  //       const formData = new FormData();
  //       formData.append("amount", selectedAmount?.toString() || "");
  //       formData.append("requestId", requestId);
  //       formData.append("phoneNumber", phoneNumber);

  //       const result = await handleMpesa(formData);
  //       console.log(result, 'result from handleMpesa');

  //       if (result.success && result.response.CheckoutRequestID) {
  //         stkPushQueryWithIntervals(result.response.CheckoutRequestID);
  //       } else if (!result.success) {
  //         toast.error(result.message || "Failed to initiate payment", {
  //           duration: 5000,
  //           position: "top-center",
  //         });
  //         setIsLoading(false);
  //         setError(result.message || "Failed to initiate payment");
  //       } else {
  //         setIsLoading(false);
  //         setError("An unexpected error occurred");
  //       }
  //     } else if (paymentMethod === "Till") {
  //       const formData = new FormData();
  //       formData.append("amount", selectedAmount?.toString() || "");
  //       formData.append("requestId", requestId);
  //       formData.append("phoneNumber", phoneNumber);

  //       const result = await handleTillPayment(formData);
  //       console.log(result, 'result from handleTillPayment');

  //       if (result.success) {
  //         toast.success("Payment initiated successfully. Please check your phone to complete the transaction.", {
  //           duration: 5000,
  //           position: "top-center",
  //         });
  //         setIsLoading(false);
  //       } else {
  //         toast.error(result.message || "Failed to initiate payment", {
  //           duration: 5000,
  //           position: "top-center",
  //         });
  //         setIsLoading(false);
  //         setError(result.message || "Failed to initiate payment");
  //       }
  //     } else if (paymentMethod === 'Paystack') {



  //       const initiatePaystackPayment = async () => {
  //         const response = await fetch("/api/paystack/initiate", {
  //           method: "POST",
  //           body: JSON.stringify({ email: "tobiasbarakan@gmail.com", amount: 1 }),
  //           headers: { "Content-Type": "application/json" },
  //         });
        
  //         const { access_code } = await response.json();
  //         console.log(access_code, 'what is this')
        
  //         const paystack = new PaystackPop();
  //         paystack.resumeTransaction(access_code);
  //       };

  //       // ✅ Fix: useEffect executes only once
  // useEffect(() => {
  //   initiatePaystackPayment();
  // }, []);
  //       // const script = document.createElement('script');
  //       // script.src = 'https://js.paystack.co/v1/inline.js';
  //       // script.onload = () => {
  //       //   const handler = (window as any).PaystackPop.setup({
  //       //     key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
  //       //     email: email,
  //       //     amount: (selectedAmount || 0) * 100,
  //       //     currency: 'KES',
  //       //     ref: `${Date.now()}`, // Generate a unique reference
  //       //     callback: function (response: any) {
  //       //       console.log('Payment successful:', response);
  //       //       toast.success('Payment successful!');
  //       //     },
  //       //     onClose: function () {
  //       //       console.log('Payment window closed');
  //       //       toast.error('Payment cancelled');
  //       //     },
  //       //   });
  //       //   handler.openIframe();
  //       // };
  //       // document.body.appendChild(script);
  //     } 
     
        
  //       else {
  //       setError('This payment method is not yet implemented.');
  //     }
  //   } catch (error) {
  //     console.error('Payment error:', error);
  //     setError('An error occurred during payment. Please try again.');
  //     toast.error('An error occurred during payment. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };