export function calculateRequestAmount(totalDonated: number, totalReceived: number) {
  console.log('Calculating request amount:', { totalDonated, totalReceived });
  // Calculate net amount as total donated minus total received
  const netAmount = totalDonated - totalReceived;
  console.log('Net amount:', netAmount);
  // Calculate request amount as 110% of net amount
  const requestAmount = Math.floor(netAmount * 1.1);
  console.log('Final request amount:', requestAmount);
  return Math.max(0, requestAmount); // Ensure it never goes below 0
}

export function calculateMaxRequestAmount(totalDonated: number, totalReceived: number) {
  const baseRequestAmount = calculateRequestAmount(totalDonated, totalReceived);
  // Add 15% buffer to the base amount
  return Math.floor(baseRequestAmount * 1.15);
} 