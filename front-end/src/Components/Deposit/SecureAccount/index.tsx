import { useEffect, useState } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';
import { SweetAlertType } from 'react-bootstrap-sweetalert/dist/types';

import { useTypedSelector } from 'Reducers';

import { ReactComponent as ResetSvg } from 'Assets/reset.svg';
import { ReactComponent as EyeSvg } from 'Assets/eye.svg';
import { ReactComponent as EyeOffSvg } from 'Assets/eye-off.svg';
import { ReactComponent as DownloadSvg } from 'Assets/download.svg';

import { getWalletRecoveryKey, resetWalletRecoveryKey } from 'API';

import Portal from 'Components/Portal';

export default function SecureAccount() {
  const [show, setShow] = useState(false);
  const [type, setType] = useState<SweetAlertType>('default');

  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');

  useEffect(() => {
    if (show && !recoveryKey) {
      getWalletRecoveryKey().then(({ data }) =>
        setRecoveryKey(data.recoveryKey)
      );
    }
  }, [show, recoveryKey]);

  const [title, setTitle] = useState('Secure account');

  const publicAddress = useTypedSelector(
    (state) => state.account.publicAddress
  );

  const handleResetState = () => {
    setType('default');
    setShow(false);

    setTitle('Recover account');
  };

  return (
    <>
      <button
        style={{ width: '45%' }}
        onClick={() => setShow(true)}
        className="btn primary"
      >
        Secure your account
      </button>
      <Portal id="secure-account-modal">
        <SweetAlert
          showConfirm={false}
          showCancel={false}
          type={type}
          title={title}
          onConfirm={() => null}
          show={show}
          onCancel={() => handleResetState()}
          input={true}
        >
          <div style={{ textAlign: 'left' }}>
            <p>
              Do not show your recovery key to anyone. Anyone with your recovery
              key will be able to access this account.
            </p>
            <p>
              Keep both your public address and recovery key in a safe place in
              order to recover this account on different devices or browsers.
            </p>
          </div>

          <div style={{ textAlign: 'left' }}>
            <h3>Public address</h3>
            <p>{publicAddress}</p>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <h3 style={{ marginRight: 'auto' }}>
                Public address recovery key
              </h3>
              <button
                onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                className="btn"
                title={
                  showRecoveryKey ? 'Hide recovery key' : 'Show recovery key'
                }
              >
                {showRecoveryKey ? (
                  <EyeOffSvg width={30} height={30} />
                ) : (
                  <EyeSvg width={30} height={30} />
                )}
              </button>
              <button
                onClick={async () => {
                  const { data } = await resetWalletRecoveryKey();
                  setRecoveryKey(data.recoveryKey);
                }}
                title="Generate new recovery key"
                aria-label="Generate recovery key"
                className="btn"
              >
                <ResetSvg width={30} height={30} />
              </button>
              <button
                className="btn"
                onClick={() => {
                  const element = document.createElement('a');

                  const file = new Blob(
                    [
                      `publicAddress\n${publicAddress}\n\nrecoveryKey\n${recoveryKey}`
                    ],
                    { type: 'text/plain' }
                  );

                  element.href = URL.createObjectURL(file);
                  element.download = 'doge-flip-recovery-keys.txt';
                  document.body.appendChild(element); // Required for this to work in FireFox
                  element.click();
                }}
              >
                <DownloadSvg width={30} height={30} />
              </button>
            </div>
            <p>
              {showRecoveryKey
                ? recoveryKey
                : `******************${recoveryKey?.slice(-5)}`}
            </p>
          </div>
          <div style={{ marginTop: '40px' }}>
            <button
              onClick={() => setShow(false)}
              className="btn"
              style={{ marginRight: '20px', minWidth: '150px' }}
            >
              Close
            </button>
            <button
              style={{ marginLeft: '20px', minWidth: '150px' }}
              onClick={() => setShow(false)}
              className="btn primary"
            >
              Continue
            </button>
          </div>
        </SweetAlert>
      </Portal>
    </>
  );
}
