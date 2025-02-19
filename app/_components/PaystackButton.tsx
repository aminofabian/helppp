'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaystackButtonProps {
  email: string
  amount: number
  requestId: string
  onSuccess: () => void
  onError: (error: string) => void
}

const PaystackButton = ({ email, amount, requestId, onSuccess, onError }: PaystackButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const PaystackPop = (await import('@paystack/inline-js')).default
      const paystack = new PaystackPop()
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        email,
        amount: amount * 100, // Convert to smallest currency unit (kobo)
        currency: 'KES',
        reference: `${requestId}_${Date.now()}`,
        onCancel: () => {
          setIsLoading(false)
          toast.error('Payment cancelled')
        },
        onSuccess: (transaction: { reference: string }) => {
          setIsLoading(false)
          toast.success('Payment completed successfully!', {
            duration: 5000,
            position: 'top-center',
          })
          onSuccess()
        },
        onError: () => {
          setIsLoading(false)
          toast.error('Payment failed. Please try again.')
          onError('Payment verification failed')
        }
      })
    } catch (error) {
      setIsLoading(false)
      toast.error('Failed to initialize payment')
      onError('Failed to initialize payment')
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
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
        Pay {amount} KES with Paystack
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/90" />
        </span>
      )}
    </button>
  )
}

export default PaystackButton
