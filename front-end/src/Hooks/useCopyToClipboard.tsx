import { useState, useRef, useEffect } from 'react';
import { copyToClipboardHelper } from './copyPollyFill';

export default function useCopyToClipboard({
  copiedTimeout
}: {
  copiedTimeout?: number;
} = {}): [
  handleCopyToClipboard: (value: string) => void,
  copied: boolean,
  setCopied: React.Dispatch<React.SetStateAction<boolean>>
] {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number>();

  useEffect(() => {
    if (!copied && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [copied]);

  const handleCopyToClipboard = (text: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (window.navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
    } else {
      copyToClipboardHelper(text);
      setCopied(true);
    }

    if (copiedTimeout) {
      timeoutRef.current = window.setTimeout(
        () => setCopied(false),
        copiedTimeout
      );
    }
  };

  return [handleCopyToClipboard, copied, setCopied];
}
