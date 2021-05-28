import { useState, useEffect } from 'react';

export default function Deposit() {
  const [publicDogeKey, setPublicDogeKey] = useState('');

  useEffect(() => {
    const lsPubKey = localStorage.getItem('publicDogeKey');

    if (!lsPubKey) {
      // generate key
    } else {
      setPublicDogeKey(lsPubKey);
    }
  }, []);

  return (
    <div>
      <h1>Deposit doge</h1>
    </div>
  );
}
