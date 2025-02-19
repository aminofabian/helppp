'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

interface PaystackButtonProps {
  email: string
  amount: number
  requestId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

const PaystackButton = ({ email, amount, requestId, onSuccess, onError }: PaystackButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePayment = async () => {
    if (!isMounted) return

    try {
      setIsLoading(true)
      toast.loading('Initializing payment...', {
        duration: 2000,
        position: 'top-center',
      })

      // Dynamically import PaystackPop only on client side
      const PaystackPop = (await import('@paystack/inline-js')).default
      const paystack = new PaystackPop()
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email,
        amount: Math.round(amount * 100), // Convert to lowest currency unit (cents)
        currency: 'KES',
        reference: `${requestId}_${Date.now()}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Request ID",
              variable_name: "request_id",
              value: requestId
            }
          ]
        },
        onSuccess: (transaction: any) => {
          setIsLoading(false)
          toast.success('Payment completed successfully! 🎉', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#10B981',
              color: '#fff',
            },
          })
          if (onSuccess) onSuccess()
        },
        onCancel: () => {
          setIsLoading(false)
          toast.error('Payment cancelled', {
            duration: 3000,
            position: 'top-center',
          })
          if (onError) onError('Payment cancelled by user')
        }
      })
    } catch (error) {
      setIsLoading(false)
      console.error('Payment initialization failed:', error)
      toast.error('Failed to initialize payment', {
        duration: 3000,
        position: 'top-center',
      })
      if (onError) onError('Failed to initialize payment')
    }
  }

  // Don't render anything until mounted
  if (!isMounted) {
    return null
  }

  return (
    <Button
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
    </Button>
  )
}

// Prevent server-side rendering of this component
export default dynamic(() => Promise.resolve(PaystackButton), {
  ssr: false
})
