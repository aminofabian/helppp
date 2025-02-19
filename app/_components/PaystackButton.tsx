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
  const [PaystackPop, setPaystackPop] = useState<any>(null)

  useEffect(() => {
    // Import PayStack only on client side
    const loadPaystack = async () => {
      try {
        const PaystackModule = await import('@paystack/inline-js')
        setPaystackPop(PaystackModule.default)
      } catch (error) {
        console.error('Failed to load Paystack:', error)
        onError('Failed to load payment module')
      }
    }
    loadPaystack()
  }, [onError])

  const handlePayment = async () => {
    if (!PaystackPop) {
      onError('Payment module not initialized')
      return
    }

    try {
      setIsLoading(true)
      const paystack = new PaystackPop()
      await paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: amount * 100, // Convert to kobo
        currency: 'KES',
        ref: `${requestId}_${Date.now()}`,
        callback: (response: any) => {
          if (response.status === 'success') {
            onSuccess()
          } else {
            onError('Payment failed')
          }
          setIsLoading(false)
        },
        onClose: () => {
          onError('Payment window closed')
          setIsLoading(false)
        }
      })
    } catch (error) {
      setIsLoading(false)
      onError(error instanceof Error ? error.message : 'Payment initialization failed')
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || !PaystackPop}
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
        Pay with Paystack
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/90" />
        </span>
      )}
    </button>
  )
}
