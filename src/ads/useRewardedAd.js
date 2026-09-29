import { useState, useCallback } from 'react';
import { useAdContext } from './AdProvider';

export function useRewardedAd() {
  const { playAd } = useAdContext();
  const [isPlaying, setIsPlaying] = useState(false);

  const showRewardedAd = useCallback(async () => {
    setIsPlaying(true);
    try {
      await playAd('rewarded');
      return true;
    } finally {
      setIsPlaying(false);
    }
  }, [playAd]);

  return { showRewardedAd, isPlaying };
}
