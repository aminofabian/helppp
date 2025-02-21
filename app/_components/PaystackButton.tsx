'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

interface PaystackButtonProps {
  email: string
  amount: number
  requestId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

const PaystackButton = ({ email, amount, requestId, onSuccess, onError }: PaystackButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      toast.loading('Initializing payment...', {
        duration: 2000,
        position: 'top-center',
      })

      const response = await fetch('/api/initialize-paystack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount, // Pass exact amount without multiplication
          reference: `${requestId}_${Date.now()}`,
          callback_url: `${window.location.origin}/api/paystack-callback`,
          metadata: {
            request_id: requestId,
            custom_fields: [
              {
                display_name: "Request ID",
                variable_name: "request_id",
                value: requestId
              }
            ]
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize payment')
      }

      // Redirect to Paystack checkout URL
      window.location.href = data.authorization_url

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

export default PaystackButton
