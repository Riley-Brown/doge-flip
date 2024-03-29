import { useState, useEffect, useRef } from 'react';

import { APP_MODE, getWalletData, syncWalletData } from 'API';

import QRCode from 'qrcode.react';

import { useDispatch } from 'react-redux';
import { setAccount, updateAccount } from 'Actions/account';
import { useTypedSelector } from 'Reducers';

import Switch from 'react-switch';
import DisplayName from './DisplayName';

import { useToasts } from 'react-toast-notifications';

import RecoverAccount from './RecoverAccount';
import SecureAccount from './SecureAccount';
import Withdraw from './Withdraw';

import dogeLogo from 'Assets/doge-logo.png';
import { ReactComponent as CopySvg } from 'Assets/clipboard.svg';
import useCopyToClipboard from 'Hooks/useCopyToClipboard';

const isDarkMode = JSON.parse(localStorage.getItem('darkMode'));

export default function Deposit() {
  const [publicDogeKey, setPublicDogeKey] = useState('');

  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [loading, setLoading] = useState(true);

  const dogeNetwork = useRef(APP_MODE === 'live' ? 'doge' : 'dogetest');

  const dispatch = useDispatch();
  const { addToast, removeToast } = useToasts();

  const balance = useTypedSelector((state) => state.account.balance);
  const account = useTypedSelector((state) => state.account);

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
      // todo: make dynamic for doge live net depending on env
      const socket = new WebSocket(
        'wss://slanger1.chain.so/app/e9f5cc20074501ca7395'
      );

      syncWalletData().then((res) => {
        if (res.data.balance !== account.balance) {
          dispatch(updateAccount({ balance: res.data.balance }));
        }

        if (res.data.pendingDeposits.length > 0) {
          res.data.pendingDeposits.forEach((pendingDeposit) => {
            socket.send(
              JSON.stringify({
                event: 'pusher:subscribe',
                data: {
                  channel: `confirm_tx_${dogeNetwork.current}_${pendingDeposit.txId}`,
                },
              })
            );

            addToast(
              <div style={{ color: '#222' }}>
                <h2 style={{ marginTop: 0 }}>Pending transaction</h2>
                <p>
                  Amount: <strong>{pendingDeposit.value}</strong>
                </p>
                <p>Tranaction id: {pendingDeposit.txId} </p>
                <p>
                  <p>Waiting to be confirmed on doge blockchain</p>
                </p>
              </div>,
              { appearance: 'warning', id: pendingDeposit.txId }
            );
          });
        }
      });

      // Ping ws every 2 minutes to keep alive
      setInterval(() => {
        socket.send(
          JSON.stringify({
            event: 'pusher:ping',
            data: {},
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
                channel: `address_${dogeNetwork.current}_${publicDogeKey}`,
              },
            })
          );
        }

        // If balance change < 0 that means the address is sending balance so don't need to care about the event
        if (
          parsed.event === 'balance_update' &&
          Number(parsedData.value.balance_change) > 0
        ) {
          addToast(
            <div style={{ color: '#222' }}>
              <h2 style={{ marginTop: 0 }}>Pending transaction</h2>
              <p>
                Amount: <strong>{parsedData.value.value_received}</strong>
              </p>
              <p>Waiting to be confirmed on doge blockchain</p>
            </div>,
            { appearance: 'warning', id: parsedData.value.tx.txid }
          );

          socket.send(
            JSON.stringify({
              event: 'pusher:subscribe',
              data: {
                channel: `confirm_tx_${dogeNetwork.current}_${parsedData.value.tx.txid}`,
              },
            })
          );
        }

        if (parsed.event === 'confirm_tx') {
          const syncedWallet = await syncWalletData();

          dispatch(setAccount(syncedWallet.data));

          const txId = parsedData.value.txid;

          removeToast(txId);

          addToast(
            <div style={{ color: '#222' }}>
              <h2 style={{ marginTop: 0 }}>Transaction confirmed!</h2>
              <p>
                Updated balance:{' '}
                <strong>{syncedWallet.data.balance.toLocaleString()}</strong>
              </p>
            </div>,
            { appearance: 'success' }
          );

          socket.send(
            JSON.stringify({
              event: 'pusher:unsubscribe',
              data: {
                channel: `confirm_tx_${dogeNetwork.current}_${txId}`,
              },
            })
          );
        }
      };
    }
  }, [publicDogeKey]);

  const [copyToClipboard] = useCopyToClipboard({
    copiedTimeout: 2000,
  });

  return (
    <div className="deposit">
      <div style={{ flex: 1 }}>
        <div className="header-wrapper">
          <div>
            <h1>Deposit doge</h1>
            <p>
              Deposits can be made to <br /> {publicDogeKey}
              <button
                title="Copy deposit address"
                className="btn"
                onClick={() => {
                  copyToClipboard(publicDogeKey);
                  addToast(
                    <div style={{ color: '#222' }}>
                      <h2 style={{ marginTop: 0 }}>
                        Deposit address copied to clipboard
                      </h2>
                    </div>,
                    { appearance: 'success', autoDismiss: true }
                  );
                }}
              >
                <CopySvg />
              </button>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SecureAccount />
          <RecoverAccount />
        </div>
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
            <span>
              <Withdraw />
            </span>
          </p>
        </div>
      </div>
      <div className="much-style-qr-wrapper">
        <div className="much-style">
          <img src={dogeLogo} alt="Doge logo" width={200} />
          <div>
            <h1>Wow much website</h1>
            <h1>Very style</h1>
          </div>
        </div>
        <QRCode
          className="qr-code"
          size={150}
          value={publicDogeKey}
          includeMargin={true}
          bgColor="#fff"
        />
      </div>
    </div>
  );
}
