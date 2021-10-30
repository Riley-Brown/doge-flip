import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';

import './PrivateLobby.scss';

import Modal from 'Components/Modal';
import CoinFlip, { CoinFlipTypes } from 'Pages/CoinFlips/CoinFlip';

import { getSingleCoinFlip } from 'API';

export default function PrivateLobby({
  coinFlipEvents
}: {
  coinFlipEvents: {
    [key: string]: CoinFlipTypes;
  };
}) {
  const [show, setShow] = useState(false);
  const [coinFlip, setCoinFlip] = useState<CoinFlipTypes>();
  const [privateLobbyId, setPrivateLobbyId] = useState('');

  const location = useLocation();

  useEffect(() => {
    if (location.search) {
      const { flipId, privateLobbyId } = queryString.parse(location.search);
      if (flipId && privateLobbyId) {
        getSingleCoinFlip(flipId as string).then((res) => {
          console.log(res);
          setCoinFlip(res.data);
          setPrivateLobbyId(privateLobbyId as string);
          setShow(true);
        });
      }
    }
  }, [location.search]);

  return (
    <Modal id="private-flip-modal" show={show} onHide={() => setShow(false)}>
      <h1 className="title">You have been invited to a doge flip</h1>
      {coinFlip && (
        <CoinFlip
          coinFlipEvent={coinFlipEvents[coinFlip._id]}
          coinFlip={coinFlip}
          isFromPrivateLink={true}
          privateLobbyId={privateLobbyId}
        />
      )}
    </Modal>
  );
}
