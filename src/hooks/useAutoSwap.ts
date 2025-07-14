import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppState } from '../contexts/AppContext';
import { useRampSwap } from './useRampSwap';

export const useAutoSwap = () => {
  const { user, web3 } = useAppState();
  const { swapUSDCToNBGN } = useRampSwap();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [swapStatus, setSwapStatus] = useState<
    'idle' | 'detecting' | 'swapping' | 'completed' | 'error'
  >('idle');
  const [lastUSDCBalance, setLastUSDCBalance] = useState<string>('0');
  const [monitoringInterval, setMonitoringInterval] = useState<number | null>(
    null
  );

  const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  const getUSDCBalance = useCallback(async () => {
    if (!web3.provider || !user.address) return '0';

    try {
      const contract = new ethers.Contract(
        USDC_ADDRESS,
        ERC20_ABI,
        web3.provider
      );
      const balance = await contract.balanceOf(user.address);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (err) {
      console.error('Error getting USDC balance:', err);
      return '0';
    }
  }, [web3.provider, user.address, ERC20_ABI]);

  const startMonitoring = useCallback(async () => {
    if (!user.address || !web3.provider) return;

    setIsMonitoring(true);
    setSwapStatus('detecting');

    // Get initial balance
    const initialBalance = await getUSDCBalance();
    setLastUSDCBalance(initialBalance);

    console.log('🔍 Starting USDC monitoring...', {
      initialBalance,
      userAddress: user.address,
    });

    // Monitor for balance changes with faster polling
    const checkForNewUSDC = async () => {
      try {
        const currentBalance = await getUSDCBalance();
        const currentBalanceNum = parseFloat(currentBalance);
        const lastBalanceNum = parseFloat(lastUSDCBalance);

        console.log('💰 Balance check:', {
          current: currentBalanceNum,
          last: lastBalanceNum,
        });

        // If USDC balance increased by more than $0.10, trigger auto-swap immediately
        if (currentBalanceNum > lastBalanceNum + 0.1) {
          console.log(
            '🚀 New USDC detected! Starting immediate conversion...',
            {
              previousBalance: lastBalanceNum,
              newBalance: currentBalanceNum,
              difference: currentBalanceNum - lastBalanceNum,
            }
          );

          setSwapStatus('swapping');

          try {
            // Calculate the new USDC amount (only convert the new amount)
            const newUSDCAmount = (
              currentBalanceNum - lastBalanceNum
            ).toString();

            console.log('🔄 Converting USDC to NBGN:', newUSDCAmount);

            // Auto-swap the new USDC to NBGN
            const result = await swapUSDCToNBGN(newUSDCAmount);

            console.log('✅ Auto-swap completed successfully!', result);
            setSwapStatus('completed');

            // Show success notification
            const notification = `🎉 Успешно! ${newUSDCAmount} USDC беше автоматично конвертиран в NBGN токени!`;

            // Use a more user-friendly notification
            if (
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              new Notification('NBGN Conversion Complete!', {
                body: notification,
                icon: '/favicon.ico',
              });
            } else {
              alert(notification);
            }
          } catch (error) {
            console.error('❌ Auto-swap failed:', error);
            setSwapStatus('error');

            // Show detailed error
            const errorMsg =
              error instanceof Error ? error.message : 'Неизвестна грешка';
            alert(
              `⚠️ Автоматичната конвертация неуспешна:\n${errorMsg}\n\nМоля опитайте ръчно от "Exchange" секцията.`
            );
          }

          // Stop monitoring after successful attempt
          setIsMonitoring(false);
          if (monitoringInterval) {
            window.clearInterval(monitoringInterval);
            setMonitoringInterval(null);
          }
        }

        setLastUSDCBalance(currentBalance);
      } catch (error) {
        console.error('Error checking USDC balance:', error);
      }
    };

    // Check every 5 seconds for faster detection
    const interval = window.setInterval(checkForNewUSDC, 5000);
    setMonitoringInterval(interval);

    // Stop monitoring after 10 minutes
    window.setTimeout(() => {
      if (interval) window.clearInterval(interval);
      setMonitoringInterval(null);
      setIsMonitoring(false);
      if (swapStatus === 'detecting') {
        setSwapStatus('idle');
      }
      console.log('⏰ USDC monitoring stopped after 10 minutes');
    }, 600000); // 10 minutes
  }, [
    user.address,
    web3.provider,
    getUSDCBalance,
    lastUSDCBalance,
    swapUSDCToNBGN,
    swapStatus,
    monitoringInterval,
  ]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setSwapStatus('idle');
    if (monitoringInterval) {
      window.clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    console.log('🛑 USDC monitoring stopped manually');
  }, [monitoringInterval]);

  return {
    isMonitoring,
    swapStatus,
    startMonitoring,
    stopMonitoring,
  };
};
