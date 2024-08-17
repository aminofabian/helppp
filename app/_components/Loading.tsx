import React from 'react'

export const LoadingSpin = () => {
  return (
    <div className="flex w-full justify-center">
    <span className="loading loading-ring loading-xs"></span>
    <span className="loading loading-ring loading-sm"></span>
    <span className="loading loading-ring loading-md"></span>
    <span className="loading loading-ring loading-lg"></span>
    </div>
  )
}
