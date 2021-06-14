import { useState } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';
import { SweetAlertType } from 'react-bootstrap-sweetalert/dist/types';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import Portal from 'Components/Portal';
import SpinnerButton from 'Components/SpinnerButton';

import { updateAccount } from 'Actions';
import { withdrawBalance } from 'API';

export default function Withdraw() {
  const [show, setShow] = useState(false);
  const [type, setType] = useState<SweetAlertType>('default');

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('Withdraw');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors
  } = useForm<{ publicAddress: string; dogeAmount: string }>();

  const dispatch = useDispatch();

  const onSubmit = handleSubmit(async ({ publicAddress, dogeAmount }) => {
    try {
      setLoading(true);

      const withdraw = await withdrawBalance({
        dogeCoinsToSend: Number(dogeAmount),
        receiverAddress: publicAddress
      });

      if (withdraw.type === 'ok') {
        setType('success');
        dispatch(updateAccount({ balance: withdraw.data.balance }));
      } else {
        setType('error');
      }

      setTitle(withdraw.message);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setType('error');
    }
  });

  const handleResetState = () => {
    setShow(false);
    setType('default');
    setLoading(false);
    setTitle('Withdraw');
    clearErrors();
    setValue('dogeAmount', '');
    setValue('publicAddress', '');
  };

  return (
    <>
      <button
        className="btn primary"
        style={{ marginLeft: '20px' }}
        onClick={() => setShow(true)}
      >
        Withdraw
      </button>
      <Portal id="withdraw-modal">
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
              <label htmlFor="public-address">Address to send to</label>
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
              <label htmlFor="doge-amount">Doge amount</label>
              <input
                {...register('dogeAmount', {
                  required: 'Doge amount is required'
                })}
                id="doge-amount"
                type="number"
              />
              {errors.dogeAmount && (
                <small className="text-danger">
                  {errors.dogeAmount.message}
                </small>
              )}
            </div>
            <div style={{ marginTop: '40px' }}>
              <button
                style={{ marginRight: '20px', minWidth: '150px' }}
                onClick={() => setShow(false)}
                className="btn"
                type="button"
              >
                Cancel
              </button>
              {type === 'success' ? (
                <button
                  className="btn primary"
                  onClick={() => handleResetState()}
                >
                  Continue
                </button>
              ) : (
                <SpinnerButton
                  loading={loading}
                  style={{
                    marginLeft: '20px',
                    minWidth: '150px'
                  }}
                  className="btn primary"
                  type="submit"
                >
                  Submit
                </SpinnerButton>
              )}
            </div>
          </form>
        </SweetAlert>
      </Portal>
    </>
  );
}
