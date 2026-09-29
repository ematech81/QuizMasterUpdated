import { useCallback } from 'react';
import { useAdContext } from './AdProvider';

export function useInterstitialAd() {
  const { playAd } = useAdContext();

  const showInterstitial = useCallback(() => playAd('interstitial'), [playAd]);

  return { showInterstitial };
}
