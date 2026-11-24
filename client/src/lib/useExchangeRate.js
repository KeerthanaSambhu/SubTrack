
import { useEffect, useState } from 'react';

const API_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR';

export function useExchangeRate() {
  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRate() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Exchange rate request failed');
        }

        const result = await response.json();
        const inrRate = result?.rates?.INR;

        if (!Number.isFinite(inrRate) || inrRate <= 0) {
          throw new Error('Invalid exchange rate');
        }

        setRate(inrRate);
        setRateDate(result.date);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(true);
          setRate(null);
          setRateDate(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRate();

    return () => controller.abort();
  }, []);

  return {
    rate,
    rateDate,
    loading,
    error,
    convertUsdToInr: rate
      ? (amount) => Number(amount) * rate
      : null,
  };
}
