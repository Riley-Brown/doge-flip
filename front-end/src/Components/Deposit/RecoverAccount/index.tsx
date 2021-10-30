import { useState } from 'react';
import { useDispatch } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
import { SweetAlertType } from 'react-bootstrap-sweetalert/dist/types';
import { useForm } from 'react-hook-form';

import { recoverWallet } from 'API';
import { setAccount } from 'Actions';

import Portal from 'Components/Portal';

export default function RecoverAccount() {
  const [show, setShow] = useState(false);
  const [type, setType] = useState<SweetAlertType>('default');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors
  } = useForm<{ publicAddress: string; recoveryKey: string }>();

  const [title, setTitle] = useState('Recover account');
  const dispatch = useDispatch();

  const onSubmit = handleSubmit(async ({ publicAddress, recoveryKey }) => {
    const recover = await recoverWallet({ publicAddress, recoveryKey });
    console.log({ recover });

    if (recover.type === 'ok') {
      setType('success');
      dispatch(setAccount(recover.data));
      setTitle('Account successfully recovered!');
    } else {
      setType('error');
      setTitle(recover.message);
    }
  });

  const handleResetState = () => {
    if (type === 'success') {
      setValue('publicAddress', '');
      setValue('recoveryKey', '');
    }

    setType('default');
    setShow(false);
    clearErrors();
    setTitle('Recover account');
  };

  return (
    <>
      <button
        style={{ width: '45%' }}
        onClick={() => setShow(true)}
        className="btn secondary"
      >
        Recover existing account
      </button>

      <Portal id="recover-account-modal">
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
              Recover an existing account using that account's public address
              and recovery key.
            </p>
            <p>
              This will <strong>overwrite</strong> the current account on this
              browser if successful.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="input-wrapper">
              <label htmlFor="public-address">Public address</label>
              <input
                {...register('publicAddress', {
                  required: 'Public address is required'
                })}
                id="public-address"
                type="text"
                autoComplete="new-password"
              />
              {errors.publicAddress && (
                <small className="text-danger">
                  {errors.publicAddress.message}
                </small>
              )}
            </div>
            <div className="input-wrapper">
              <label htmlFor="recovery-key">Public address recovery key</label>
              <input
                {...register('recoveryKey', {
                  required: 'Recovery key is required'
                })}
                id="recovery-key"
                type="password"
                autoComplete="new-password"
              />
              {errors.recoveryKey && (
                <small className="text-danger">
                  {errors.recoveryKey.message}
                </small>
              )}
            </div>
            <div style={{ marginTop: '40px' }}>
              <button
                style={{ marginRight: '20px', minWidth: '150px' }}
                onClick={() => {
                  handleResetState();
                  setValue('publicAddress', '');
                  setValue('recoveryKey', '');
                }}
                className="btn"
                type="button"
              >
                Cancel
              </button>
              <button
                style={{ marginLeft: '20px', minWidth: '150px' }}
                className="btn primary"
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </SweetAlert>
      </Portal>
    </>
  );
}
