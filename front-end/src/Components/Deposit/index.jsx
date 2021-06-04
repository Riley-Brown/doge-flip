import { useState, useEffect, useRef } from 'react';

import { getWalletData, syncWalletData } from 'API';

import QRCode from 'qrcode.react';

import { useDispatch } from 'react-redux';
import { setAccount, updateAccount } from 'Actions/account';
import { useTypedSelector } from 'Reducers';

import Switch from 'react-switch';
import DisplayName from './DisplayName';

const isDarkMode = JSON.parse(localStorage.getItem('darkMode'));

export default function Deposit() {
  const [publicDogeKey, setPublicDogeKey] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState();
  const [depositConfirmed, setDepositConfirmed] = useState(false);

  const [loading, setLoading] = useState(true);

  const pendingDepositRef = useRef();

  const dispatch = useDispatch();

  const balance = useTypedSelector((state) => state.account.balance);
  const account = useTypedSelector((state) => state.account);

  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    if (darkMode) {
      localStorage.setItem('darkMode', true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      localStorage.setItem('darkMode', false);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    getWalletData().then(({ data }) => {
      setPublicDogeKey(data.publicAddress);
      dispatch(setAccount(data));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (publicDogeKey) {
      syncWalletData(publicDogeKey).then((res) => {
        if (res.data.balance !== account.balance) {
          dispatch(updateAccount({ balance: res.data.balance }));
        }
      });

      // todo: make dynamic for doge live net depending on env
      const socket = new WebSocket(
        'wss://slanger1.chain.so/app/e9f5cc20074501ca7395?protocol=7&client=js&version=2.1.6&flash=false'
      );

      // Ping ws every 2 minutes to keep alive
      setInterval(() => {
        socket.send(
          JSON.stringify({
            event: 'pusher:ping',
            data: {}
          })
        );
      }, 120000);

      socket.onmessage = async (e) => {
        const parseData = (data) => {
          if (!data) return {};
          if (typeof data === 'object') return data;
          if (typeof data === 'string') return JSON.parse(data);

          return {};
        };

        const parsed = parseData(e.data);
        const parsedData = parseData(parsed.data);

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

        // If balance change < 0 that means the address is sending balance so don't need to care about the event
        if (
          parsed.event === 'balance_update' &&
          Number(parsedData.value.balance_change) > 0
        ) {
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

          setTimeout(() => {
            pendingDepositRef.current = undefined;
            setPendingDeposit(false);
            setDepositConfirmed(false);
          }, 5000);

          const syncedWallet = await syncWalletData();

          dispatch(setAccount(syncedWallet.data));

          socket.send(
            JSON.stringify({
              event: 'pusher:unsubscribe',
              data: {
                channel: `confirm_tx_dogetest_${pendingDepositRef.current.value.tx.txid}`
              }
            })
          );
        }
      };
    }
  }, [publicDogeKey]);

  return (
    <div className="deposit">
      <div>
        <h1>Deposit doge</h1>
        <p>
          Deposits can be made to <br /> {publicDogeKey}
        </p>
        <p>
          Current system using DOGE test net, DO NOT send real doge, you will
          lose it forever
        </p>
        <p style={{ marginBottom: 40 }}>
          Use the{' '}
          <a
            style={{ color: 'var(--text-primary)' }}
            href="https://doge-faucet-testnet.ggcorp.fr/"
            target="_blank"
            rel="noopener"
          >
            Doge TestNet Faucet
          </a>{' '}
          to send test balance
        </p>
        <DisplayName loading={loading} />
        <div style={{ margin: '20px 0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ marginRight: 10 }}>Dark mode</span>
            <Switch
              onChange={() => setDarkMode(!darkMode)}
              checked={darkMode}
              onColor={'#2663f2'}
            />
          </label>
        </div>
        <div>
          <p style={{ margin: 0 }}>
            Doge balance:{' '}
            <span>
              <strong style={{ fontWeight: 600 }}>
                {balance.toLocaleString()}
              </strong>
            </span>
          </p>
        </div>
        {pendingDeposit && (
          <div
            className={
              depositConfirmed ? 'deposit-confirmed' : 'deposit-pending'
            }
          >
            <h3>
              {depositConfirmed
                ? 'Transaction confirmed! Balance has been updated'
                : 'Pending transaction'}
            </h3>
            <h3>Amount: {pendingDeposit.value?.value_received}</h3>
            {!depositConfirmed && (
              <p>Waiting to be confirmed on doge blockchain</p>
            )}
          </div>
        )}
      </div>
      <QRCode
        className="qr-code"
        size={150}
        value={publicDogeKey}
        includeMargin={true}
        bgColor="#fff"
      />
    </div>
  );
}
