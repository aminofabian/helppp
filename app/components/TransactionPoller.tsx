import { useEffect } from 'react';
import { startTransactionPolling } from '@/app/utils/pollTransactions';

export default function TransactionPoller() {
  useEffect(() => {
    // Start polling every 5 minutes
    const stopPolling = startTransactionPolling(5);

    // Cleanup on component unmount
    return () => {
      stopPolling();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
