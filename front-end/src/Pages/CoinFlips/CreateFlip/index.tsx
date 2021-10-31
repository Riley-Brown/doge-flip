import React, { useEffect, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import Modal from 'Components/Modal';
import SpinnerButton from 'Components/SpinnerButton';

import { createCoinFlip } from 'API';

import dogeLogoHeads from 'Assets/doge-logo-heads.png';
import dogeLogoTails from 'Assets/doge-logo-tails.png';

import './CreateFlip.scss';
import { useTypedSelector } from 'Reducers';
import { updateAccount } from 'Actions';
import { copyToClipboardHelper } from 'Hooks/copyPollyFill';

export default function CreateFlip({
  setActiveCoinFlips
}: {
  setActiveCoinFlips: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [show, setShow] = useState(false);
  const [side, setSide] = useState<'heads' | 'tails'>();
  const [isPrivateLobby, setIsPrivateLobby] = useState(false);

  const { addToast } = useToasts();

  const dispatch = useDispatch();

  const account = useTypedSelector((state) => state.account);

  const {
    setError,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors
  } = useForm<{ dogeAmount: number | null; side: string }>();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    register('side', { required: 'Side is required' });
  }, []);

  useEffect(() => {
    return () => handleResetState();
  }, [show]);

  const handleResetState = () => {
    setSide(undefined);
    setIsPrivateLobby(false);
    setValue('side', '');
    setValue('dogeAmount', null);
    clearErrors();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
      const create = await createCoinFlip({
        dogeAmount: Number(data.dogeAmount),
        side,
        isPrivateLobby
      });

      if (create.type === 'ok') {
        dispatch(updateAccount({ balance: create.data.balance }));

        addToast(
          <>
            <h2 style={{ margin: 0 }}>Successfully created coin flip!</h2>
            {create.data.privateLobbyId && (
              <p>
                A shareable link has been copied to your clipboard, anyone with
                this link will be able to join this flip.
              </p>
            )}
          </>,
          {
            appearance: 'success',
            autoDismiss: isPrivateLobby ? false : true
          }
        );

        if (create.data.privateLobbyId) {
          copyToClipboardHelper(
            `${window.location.origin}?flipId=${create.data._id}&privateLobbyId=${create.data.privateLobbyId}`
          );
        }

        setShow(false);
        setSide(undefined);
      }

      if (create.type === 'balanceError') {
        setError('dogeAmount', {
          message: 'Doge amount cannot be more than current balance'
        });
      }

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  });

  return (
    <>
      <Modal
        id="create-flip-modal"
        show={show}
        onHide={() => {
          setShow(false);
          setSide(undefined);
        }}
      >
        <h2>Create new flip</h2>
        <form onSubmit={onSubmit}>
          <div className="input-wrapper">
            <label htmlFor="doge-amount">Doge amount</label>
            <input
              inputMode="numeric"
              {...register('dogeAmount', {
                required: 'Amount is required',
                validate: {
                  negative: (value) =>
                    Number(value) < 0 ? 'Amount must be greater than 0' : true
                }
              })}
              id="doge-amount"
              type="number"
              className={`${errors.dogeAmount ? 'invalid' : ''}`}
            />
            {errors.dogeAmount && (
              <small
                style={{ marginTop: '5px', display: 'block' }}
                className="text-danger"
              >
                {errors.dogeAmount.message}
              </small>
            )}
          </div>
          <div className="input-wrapper">
            <label htmlFor="private-lobby">
              Private Lobby
              <input
                defaultChecked={false}
                onChange={(e) => setIsPrivateLobby(e.target.checked)}
                id="private-lobby"
                type="checkbox"
                placeholder="Private Lobby"
              />
            </label>
            <small>
              An opponent will only be able to join this flip with the link
              generated after creation
            </small>
          </div>
          <p style={{ textAlign: 'center' }}>Choose a side</p>
          {errors.side && (
            <small
              style={{
                marginTop: '5px',
                display: 'block',
                textAlign: 'center'
              }}
              className="text-danger"
            >
              Side is required
            </small>
          )}
          <div className="choose-side-wrapper">
            <div
              aria-label="Select heads"
              data-selected={side === 'heads'}
              className="side"
              tabIndex={0}
              onClick={() => {
                setSide('heads');
                setValue('side', 'heads');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSide('heads');
                  setValue('side', 'heads');
                }
              }}
            >
              <span>Heads</span>
              <img src={dogeLogoHeads} alt="Heads" />
            </div>
            <div
              aria-label="Select tails"
              data-selected={side === 'tails'}
              className="side"
              tabIndex={0}
              onClick={() => {
                setSide('tails');
                setValue('side', 'heads');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSide('tails');
                  setValue('side', 'heads');
                }
              }}
            >
              <span>Tails</span>
              <img src={dogeLogoTails} alt="Tails" />
            </div>
          </div>
          <SpinnerButton type="submit" className="create" loading={loading}>
            Create
          </SpinnerButton>
        </form>
      </Modal>
      <button
        className="btn"
        style={{
          background: 'var(--primary)',
          color: '#fff',
          marginLeft: 20
        }}
        onClick={() => setShow(true)}
      >
        Create flip
      </button>
    </>
  );
}
