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
    setError,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors
  } = useForm<{ publicAddress: string; recoveryKey: string }>();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('Recover account');
  const dispatch = useDispatch();

  const onSubmit = handleSubmit(async ({ publicAddress, recoveryKey }) => {
    setLoading(true);

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

    setLoading(false);
  });

  console.log(errors);

  const handleResetState = () => {
    setType('default');
    setShow(false);
    clearErrors();
    setTitle('Recover account');
    setLoading(false);
    setValue('publicAddress', '');
    setValue('recoveryKey', '');
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
          <form onSubmit={onSubmit}>
            <div className="input-wrapper">
              <label htmlFor="public-address">Public address</label>
              <input
                {...register('publicAddress', {
                  required: 'Public address is required'
                })}
                id="public-address"
                type="text"
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
                type="text"
              />
              {errors.recoveryKey && (
                <small className="text-danger">
                  {errors.recoveryKey.message}
                </small>
              )}
            </div>
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => setShow(false)}
                className="btn"
                type="button"
              >
                Cancel
              </button>
              <button className="btn primary" type="submit">
                Submit
              </button>
            </div>
          </form>
        </SweetAlert>
      </Portal>
    </>
  );
}
