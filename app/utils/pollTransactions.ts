import axios from 'axios';

export async function pollTransactions() {
  try {
    const response = await axios.get('/api/poll-transactions');
    console.log('Transaction polling completed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in transaction polling:', error);
    throw error;
  }
}

// Function to start polling at regular intervals
export function startTransactionPolling(intervalMinutes = 5) {
  // Initial poll
  pollTransactions();

  // Set up recurring polling
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(pollTransactions, intervalMs);

  return () => {
    clearInterval(intervalId); // Function to stop polling
  };
}
