import { CSSProperties, ReactNode, useEffect } from 'react';

import Fade from 'Components/Fade';
import Portal from 'Components/Portal';
import './Modal.scss';

export default function Modal({
  show,
  onHide,
  id,
  children,
  backdropStyles
}: {
  show: boolean;
  onHide: () => void;
  id: string;
  children: ReactNode;
  backdropStyles?: CSSProperties;
}) {
  useEffect(() => {
    const handleKeydownClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeydownClose, false);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeydownClose, false);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeydownClose, false);
      document.body.style.overflow = '';
    };
  }, [show]);

  return (
    <Portal id={id}>
      <Fade inProp={show}>
        <div
          onKeyDownCapture={(e) => console.log(e)}
          onKeyPress={(e) => {
            console.log(e);
          }}
          className="modal-backdrop"
          onClick={() => onHide()}
        >
          <div
            style={backdropStyles}
            className="container"
            onKeyDown={(e) => console.log(e)}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </Fade>
    </Portal>
  );
}
