'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import PayStack to avoid SSR issues
const PaystackPop = dynamic(
  () => import("@paystack/inline-js"),
  { ssr: false }
)

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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handlePayment = async () => {
    try {
      if (!isClient) return

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
        },
        onClose: () => {
          onError('Payment window closed')
        }
      })
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment initialization failed')
    }
  }

  if (!isClient) return null

  return (
    <button
      onClick={handlePayment}
      className="w-full px-6 py-3.5 font-medium text-white bg-gradient-to-r from-primary to-primary/90 rounded-xl"
    >
      Pay with Paystack
    </button>
  )
}
