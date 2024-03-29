import { useEffect, useState } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';

import { useTypedSelector } from 'Reducers';

import { ReactComponent as ResetSvg } from 'Assets/reset.svg';
import { ReactComponent as EyeSvg } from 'Assets/eye.svg';
import { ReactComponent as EyeOffSvg } from 'Assets/eye-off.svg';
import { ReactComponent as DownloadSvg } from 'Assets/download.svg';

import { getWalletRecoveryKey, resetWalletRecoveryKey } from 'API';

import { ReactComponent as CopySvg } from 'Assets/clipboard.svg';

import Portal from 'Components/Portal';
import useCopyToClipboard from 'Hooks/useCopyToClipboard';

import './SecureAccount.scss';

export default function SecureAccount() {
  const [show, setShow] = useState(false);

  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');

  useEffect(() => {
    if (show && !recoveryKey) {
      getWalletRecoveryKey().then(({ data }) =>
        setRecoveryKey(data.recoveryKey)
      );
    }
  }, [show, recoveryKey]);

  const publicAddress = useTypedSelector(
    (state) => state.account.publicAddress
  );

  const [handleCopyPublicAddress, publicAddressCopied] = useCopyToClipboard({
    copiedTimeout: 2000
  });

  const [handleCopyRecoveryKey, recoveryKeyCopied] = useCopyToClipboard({
    copiedTimeout: 2000
  });

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
          type={'default'}
          title={'Secure account'}
          onConfirm={() => null}
          show={show}
          onCancel={() => setShow(false)}
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
            <h3>
              Public address
              <button
                onClick={() => handleCopyPublicAddress(publicAddress)}
                title="Copy Public address"
                className="btn"
              >
                <CopySvg />
              </button>
              {publicAddressCopied && (
                <small
                  style={{
                    display: 'block',
                    fontWeight: 400,
                    fontSize: '1rem',
                    color: 'var(--success-darker)'
                  }}
                >
                  Copied to clipboard
                </small>
              )}
            </h3>

            <p>{publicAddress}</p>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <h3 style={{ marginRight: 'auto' }}>
                Recovery key
                <button
                  onClick={() => handleCopyRecoveryKey(recoveryKey)}
                  title="Copy Recovery key"
                  className="btn"
                >
                  <CopySvg />
                </button>
                {recoveryKeyCopied && (
                  <small
                    style={{
                      display: 'block',
                      fontWeight: 400,
                      fontSize: '1rem',
                      color: 'var(--success-darker)'
                    }}
                  >
                    Copied to clipboard
                  </small>
                )}
              </h3>
              <div>
                <button
                  onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                  className="btn"
                  title={
                    showRecoveryKey ? 'Hide recovery key' : 'Show recovery key'
                  }
                >
                  {showRecoveryKey ? <EyeOffSvg /> : <EyeSvg />}
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
                  <ResetSvg />
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
                  <DownloadSvg />
                </button>
              </div>
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
