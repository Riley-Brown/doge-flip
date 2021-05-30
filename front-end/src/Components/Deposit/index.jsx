import { useState, useEffect, useRef } from 'react';

import { createWallet, syncWalletData } from 'API';

import QRCode from 'qrcode.react';

import { useDispatch } from 'react-redux';
import { setAccount } from 'Actions/account';
import { useTypedSelector } from 'Reducers';

export default function Deposit() {
  const [publicDogeKey, setPublicDogeKey] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState();
  const [depositConfirmed, setDepositConfirmed] = useState(false);

  const pendingDepositRef = useRef();

  const dispatch = useDispatch();

  const balance = useTypedSelector((state) => state.account.balance);

  useEffect(() => {
    const lsPubKey = localStorage.getItem('publicDogeKey');

    if (!lsPubKey) {
      createWallet().then(({ data }) => {
        console.log(data);
        setPublicDogeKey(data.publicAddress);
        localStorage.setItem('publicDogeKey', data.publicAddress);
      });
    } else {
      setPublicDogeKey(lsPubKey);
    }
  }, []);

  useEffect(() => {
    if (publicDogeKey) {
      syncWalletData(publicDogeKey).then((res) => {
        dispatch(setAccount(res.data));
      });

      // todo: make dynamic for doge live net depending on env
      const socket = new WebSocket(
        'wss://slanger1.chain.so/app/e9f5cc20074501ca7395?protocol=7&client=js&version=2.1.6&flash=false'
      );

      socket.onopen = (e) => {
        console.log(e);
      };

      socket.onmessage = async (e) => {
        console.log(e.data);
        const parsed = JSON.parse(e.data);
        const parsedData = JSON.parse(parsed.data);

        console.log(parsedData);

        console.log(parsed);
        if (parsed.event === 'pusher:connection_established') {
          socket.send(
            JSON.stringify({
              event: 'pusher:subscribe',
              data: {
                // todo: make dogetest dynamic based on env
                channel: `address_dogetest_${publicDogeKey}`
              }
            })
          );
        }

        if (parsed.event === 'balance_update') {
          setPendingDeposit(parsedData);
          pendingDepositRef.current = parsedData;

          socket.send(
            JSON.stringify({
              event: 'pusher:subscribe',
              data: {
                // todo: make dogetest dynamic based on env
                channel: `confirm_tx_dogetest_${parsedData.value.tx.txid}`
              }
            })
          );
        }

        if (parsed.event === 'confirm_tx') {
          setDepositConfirmed(true);

          const syncedWallet = await syncWalletData(publicDogeKey);

          dispatch(setAccount(syncedWallet.data));

          socket.send(
            JSON.stringify({
              event: 'pusher:unsubscribe',
              data: { channel: pendingDepositRef.current.value.tx.txid }
            })
          );
        }
      };
    }
  }, [publicDogeKey]);

  return (
    <div style={{ display: 'flex', textAlign: 'center', alignItems: 'center' }}>
      <div>
        <h1>Deposit doge</h1>
        <p>
          Deposits can be made to <br /> {publicDogeKey}
        </p>
        <p>
          Current system using DOGE test net, DO NOT send real doge, you will
          lose it forever
        </p>
        {balance && (
          <div
            style={{
              backgroundColor: 'var(--success-darker)',
              padding: 5,
              color: '#fff',
              borderRadius: 4
            }}
          >
            <p style={{ fontWeight: 600 }}>Current doge balance: {balance}</p>
          </div>
        )}
        {pendingDeposit && (
          <div
            style={{
              background: depositConfirmed ? 'green' : 'red',
              color: '#fff',
              padding: 10,
              borderRadius: 4
            }}
          >
            <h4>Pending transaction</h4>
            <h4>Amount: {pendingDeposit.value.value_received}</h4>
          </div>
        )}
      </div>
      {publicDogeKey && (
        <QRCode
          style={{ marginLeft: 40 }}
          size={150}
          value={publicDogeKey}
          includeMargin={true}
          bgColor="#fff"
        />
      )}
    </div>
  );
}
