import { useState } from 'react';

export const useForceUpdate = () => {
  const [, setForceUpdate] = useState({});

  return () => setForceUpdate({});
};