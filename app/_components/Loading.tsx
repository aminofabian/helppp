import React from 'react'

export const LoadingSpin = () => {
  return (
    <div className="flex w-full items-center justify-center space-x-4 py-8">
      <span className="loading loading-ring loading-xs text-primary"></span>
      <span className="loading loading-ring loading-sm text-secondary"></span>
      <span className="loading loading-ring loading-md text-accent"></span>
      <span className="loading loading-ring loading-lg text-primary"></span>
    </div>
  )
}
