export function calculateRequestAmount(totalDonated: number, totalReceived: number) {
  const netAmount = totalDonated - totalReceived;
  const requestAmount = netAmount * 1.11; // 111% of net amount
  return requestAmount;
}

export function calculateMaxRequestAmount(totalDonated: number, totalReceived: number) {
  const baseRequestAmount = calculateRequestAmount(totalDonated, totalReceived);
  return Math.max(0, baseRequestAmount * 1.15); // 115% of request amount, minimum 0
} 