export function calculateRequestAmount(totalDonated: number, totalReceived: number) {
  const netAmount = totalDonated - totalReceived;
  // Use integer arithmetic: multiply by 111 then divide by 100
  const requestAmount = Math.floor((netAmount * 111) / 100);
  return requestAmount;
}

export function calculateMaxRequestAmount(totalDonated: number, totalReceived: number) {
  const baseRequestAmount = calculateRequestAmount(totalDonated, totalReceived);
  // Use integer arithmetic: multiply by 115 then divide by 100
  return Math.max(0, Math.floor((baseRequestAmount * 115) / 100));
} 