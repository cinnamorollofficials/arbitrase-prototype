import { useEffect, useState } from 'react';

export default function useTransactions() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('arbitrage_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedTxId, setExpandedTxId] = useState(null);

  // Background transaction pipeline simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prevTxs) => {
        let changed = false;
        const updated = prevTxs.map((tx) => {
          const currentStep = tx.stepIndex !== undefined ? tx.stepIndex : 0;
          if (currentStep < 5) {
            changed = true;
            const nextStep = currentStep + 1;
            let newStatus = 'Diproses';
            if (nextStep === 5) {
              newStatus = 'Selesai';
            }
            return {
              ...tx,
              stepIndex: nextStep,
              status: newStatus
            };
          }
          return tx;
        });
        if (changed) {
          localStorage.setItem('arbitrage_transactions', JSON.stringify(updated));
          return updated;
        }
        return prevTxs;
      });
    }, 4000); // Progress every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return { transactions, setTransactions, expandedTxId, setExpandedTxId };
}
