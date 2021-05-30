import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function createRootElement(id) {
  const rootElement = document.createElement('div');
  rootElement.id = id;
  return rootElement;
}

export default function Portal({ id, children }) {
  const [rootElement, setRootElement] = useState(() =>
    document.getElementById(id)
  );

  useEffect(() => {
    const newRootElement = rootElement || createRootElement(id);

    // If there is no existing DOM element, add a new one.
    if (!rootElement) {
      document.body.appendChild(newRootElement);
    }

    setRootElement(newRootElement);

    // Remove root element from DOM on component unmount
    return () => newRootElement.remove();
  }, [id]);

  if (!rootElement) {
    return null;
  }

  return createPortal(children, rootElement);
}
