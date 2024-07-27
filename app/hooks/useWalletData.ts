import { useState, useEffect } from 'react';

export const useWalletData = (userId: string | null, interval: number = 10000) => {
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const res = await fetch(`/api/wallet?userId=${userId}`);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await res.json();
        console.log('Wallet data fetched:', data); // Log to debug
        setWallet(data);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [userId, interval]);

  return { wallet, isLoading, isError };
};