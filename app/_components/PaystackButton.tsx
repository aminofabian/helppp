'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface PaystackButtonProps {
  email: string
  amount: number
  requestId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaystackButton({
  email,
  amount,
  requestId,
  onSuccess,
  onError
}: PaystackButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const handlePayment = async () => {
    if (!isInitialized) {
      onError('Payment module not initialized')
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      onError('PayStack API key is not configured')
      return
    }

    try {
      setIsLoading(true)
      
      const PaystackPop = (await import('@paystack/inline-js')).default
      const paystack = new PaystackPop()

      paystack.newTransaction({
        key: paystackKey,
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'KES',
        reference: `${requestId}_${Date.now()}`,
        onSuccess: (response: any) => {
          console.log('Payment successful:', response)
          onSuccess()
          setIsLoading(false)
        },
        onCancel: () => {
          console.log('Payment cancelled')
          onError('Payment was cancelled')
          setIsLoading(false)
        }
      })
    } catch (error) {
      console.error('Payment error:', error)
      setIsLoading(false)
      onError(error instanceof Error ? error.message : 'Payment initialization failed')
    }
  }

  // Initialize Paystack on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await import('@paystack/inline-js')
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize Paystack:', error)
        onError('Failed to initialize payment module')
      }
    }
    initialize()
  }, [onError])

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || !isInitialized}
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
        {!isInitialized ? 'Loading...' : 'Pay with Paystack'}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/90" />
        </span>
      )}
    </button>
  )
}
