import { useState, useEffect, useRef } from 'react';

import { createWallet, syncWalletData, updateWallet } from 'API';

import QRCode from 'qrcode.react';

import { ReactComponent as EditSvg } from 'Assets/edit.svg';

import { useDispatch } from 'react-redux';
import { setAccount, updateAccount } from 'Actions/account';
import { useTypedSelector } from 'Reducers';

export default function Deposit() {
  const [publicDogeKey, setPublicDogeKey] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState();
  const [depositConfirmed, setDepositConfirmed] = useState(false);

  const pendingDepositRef = useRef();

  const dispatch = useDispatch();

  const balance = useTypedSelector((state) => state.account.balance);
  const account = useTypedSelector((state) => state.account);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [updatedDisplayName, setUpdatedDisplayName] = useState('');

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

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    await updateWallet({
      displayName: updatedDisplayName,
      publicAddress: publicDogeKey
    });

    dispatch(updateAccount({ displayName: updatedDisplayName }));
    setIsEditingDisplayName(false);
  };

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
        <p>
          Use the{' '}
          <a
            href="https://doge-faucet-testnet.ggcorp.fr/"
            target="_blank"
            rel="noopener"
          >
            Doge TestNet Faucet
          </a>{' '}
          to send test balance
        </p>
        <div style={{ margin: '20px 0' }}>
          {(!account.displayName || isEditingDisplayName) && (
            <form onSubmit={handleUpdateAccount}>
              <label htmlFor="display-name">Display name</label>
              <input
                type="text"
                id="display-name"
                defaultValue={account.displayName}
                style={{ padding: 5, marginLeft: 10 }}
                onChange={(e) => setUpdatedDisplayName(e.target.value)}
              />
            </form>
          )}
          {account.displayName && (
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              Display name: {account.displayName}
              <button
                className="btn"
                onClick={() => setIsEditingDisplayName(true)}
              >
                <EditSvg />
              </button>
            </h2>
          )}
        </div>
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
