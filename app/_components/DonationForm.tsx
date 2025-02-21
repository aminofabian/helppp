// After successful donation processing
const handleDonationSuccess = (amount: number) => {
  // Calculate points (1 point per 50 KES)
  const points = Math.floor(amount / 50);
  
  // Emit donation event
  const donationEvent = new CustomEvent('donation-made', {
    detail: {
      amount,
      points,
      timestamp: new Date().toISOString()
    }
  });
  window.dispatchEvent(donationEvent);
  
  // Rest of your success handling code
}; 