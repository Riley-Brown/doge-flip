import { FormEvent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { ReactComponent as EditSvg } from 'Assets/edit.svg';

import { updateWallet } from 'API';
import { useTypedSelector } from 'Reducers';
import { updateAccount } from 'Actions';

export default function DisplayName({ loading }: { loading: boolean }) {
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);

  const dispatch = useDispatch();
  const displayName = useTypedSelector((state) => state.account.displayName);

  const [updatedDisplayName, setUpdatedDisplayName] = useState(displayName);

  useEffect(() => {
    if (displayName) {
      setUpdatedDisplayName(displayName);
    }
  }, [displayName]);

  const handleUpdateAccount = async (e: FormEvent) => {
    e.preventDefault();
    const update = await updateWallet({
      displayName: updatedDisplayName
    });

    if (update.type === 'ok') {
      dispatch(updateAccount({ displayName: updatedDisplayName }));
      setIsEditingDisplayName(false);
    }
  };

  return (
    <div style={{ margin: '10px 0' }}>
      {!loading && (!displayName || isEditingDisplayName) ? (
        <form onSubmit={handleUpdateAccount}>
          <div className="input-wrapper">
            <label htmlFor="display-name">Display name</label>
            <input
              type="text"
              id="display-name"
              defaultValue={displayName}
              onChange={(e) => setUpdatedDisplayName(e.target.value)}
            />
            <div className="btn-wrapper">
              {displayName && (
                <button
                  style={{ color: 'var(--main-font-color)' }}
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsEditingDisplayName(false);
                    setUpdatedDisplayName(displayName);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                style={{ background: 'var(--primary)', color: '#fff' }}
                className="btn"
              >
                Update name
              </button>
            </div>
          </div>
        </form>
      ) : (
        <h2 style={{ fontSize: '1rem', fontWeight: 400, margin: 0 }}>
          Display name:{' '}
          <strong style={{ fontWeight: 600 }}>{displayName}</strong>
          <button
            style={{ padding: 0, marginLeft: 10 }}
            className="btn"
            onClick={() => setIsEditingDisplayName(true)}
          >
            <EditSvg />
          </button>
        </h2>
      )}
    </div>
  );
}
