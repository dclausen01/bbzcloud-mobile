import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export function useOrientation() {
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    function updateOrientation() {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    }

    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => {
      subscription.remove();
    };
  }, []);

  return orientation;
}
