'use client';

import { useEffect } from 'react';
import { AdBlocker } from '@/lib/adblocker';

export const AdBlockerInit = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      AdBlocker.init();
    }
  }, []);

  return null;
};
