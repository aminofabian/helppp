import React, { useCallback, useEffect, useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { CreateOrderData, CreateOrderActions, OnApproveData, OnApproveActions } from "@paypal/paypal-js";
import { handlePayPalPayment } from '../actions';
import toast from 'react-hot-toast';


interface PayPalButtonWrapperProps {
    onPaymentSuccess: (details: any) => void;
    onPaymentError: (error: any) => void;
    selectedAmount: number;
    setErrorMessage: (message: string) => void;
    errorMessage: string;
  }

const PayPalButtonWrapper: React.FC<PayPalButtonWrapperProps> = ({
  onPaymentSuccess,
  onPaymentError,
  selectedAmount,
  setErrorMessage,
  errorMessage
}) => {

  const [isPayPalReady, setIsPayPalReady] = useState(false);

  useEffect(() => {
    // Set a small timeout to simulate PayPalButtons loading (optional)
    const timer = setTimeout(() => setIsPayPalReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

 
    interface AmountValidationProps {
        selectedAmount: number;
        setErrorMessage: (message: string) => void;
    }

    const isAmountValid = ({ selectedAmount, setErrorMessage }: AmountValidationProps): boolean => {
        const amountValue = parseFloat(selectedAmount.toString());
        if (isNaN(amountValue)) {
            setErrorMessage("Please enter a valid amount.");
            return false;
        } else if (amountValue <= 0) {
            setErrorMessage("Amount must be greater than 0.");
            return false;
        } else if (amountValue > 500000) {
            setErrorMessage("Amount cannot exceed 500,000.");
            return false;
        }
        return true;
    };
    
    const onCreateOrder = useCallback(
        (data: CreateOrderData, actions: CreateOrderActions) => {
          if (!isAmountValid({ selectedAmount, setErrorMessage })) {
            return Promise.reject(new Error(errorMessage)); 
          }
      
          return actions.order
            .create({
              intent: "CAPTURE",
              application_context: {
                shipping_preference: "GET_FROM_FILE",
              },
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: parseFloat(selectedAmount.toString()).toFixed(2), 
                  },
                },
              ],
            })
            .then((orderID) => {
              if (typeof orderID === 'string') {
                return orderID;
              } else {
                throw new Error("Order ID is not a string");
              }
            })
            .catch((err) => {
              setErrorMessage("An error occurred while creating the order. Please try again.");
              return Promise.reject(err);
            });
        },
        [selectedAmount, setErrorMessage, errorMessage]
      );

const onApprove = async (data: OnApproveData, actions: OnApproveActions) => {
  if (actions.order) {
    try {
      const details = await actions.order.capture();
      console.log('this is the details', details);

      if (details.id) {
        const formData = new FormData();

        formData.append('id', details.id);
        if (details.purchase_units && details.purchase_units[0].amount) {
          formData.append('amount', details.purchase_units[0].amount.value); 
        } else {
          throw new Error("Purchase units or amount is undefined");
        }
        formData.append('create_time', details.create_time || '');
        formData.append('payer_email', details.payer?.email_address || '');
        formData.append('payer_name', `${details.payer?.name?.given_name || ''} ${details.payer?.name?.surname || ''}`);
        formData.append('requestId', data.orderID || ''); 
        const paymentResponse = await handlePayPalPayment(formData);

        if (paymentResponse.success) {
          console.log('Payment successfully saved:', paymentResponse.paymentRecord);
          toast.success('Payment successfully saved');
          onPaymentSuccess(details.id);
        } else {
          throw new Error(paymentResponse.message || 'Unknown error while saving payment');
        }
      } else {
        throw new Error("PayPal order ID is undefined");
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error : new Error("Unknown error occurred"));
    }
  } else {
    onPaymentError(new Error("PayPal actions.order is undefined"));
  }
};


  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
     
      {/* <div className="paypal-button-container">
          <PayPalButtons
          forceReRender={[selectedAmount]}
            createOrder={onCreateOrder}
            onApprove={onApprove}
            onError={(err) => {
              onPaymentError(err instanceof Error ? err : new Error("Unknown PayPal error occurred"));
            }}
            style={{
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "donate"
            }}
          />
        </div> */}
        <div className="paypal-button-container">
      {isPayPalReady ? (
        <PayPalButtons
          forceReRender={[selectedAmount]}
          createOrder={onCreateOrder}
          onApprove={onApprove}
          onError={(err) => {
            onPaymentError(err instanceof Error ? err : new Error("Unknown PayPal error occurred"));
          }}
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "donate",
          }}
        />
      ) : (
        // Loading spinner for when the PayPal button is not ready
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50"></div>
          <p className="ml-4 text-gray-500">Loading PayPal button...</p>
        </div>
      )}
    </div>
    </div>
  );
};

export default PayPalButtonWrapper;
