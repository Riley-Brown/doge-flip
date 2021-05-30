import { ReactNode } from 'react';

type SpinnerButtonTypes = {
  className?: string;
  loading: boolean;
  success?: boolean;
  successClass?: string;
  children?: ReactNode;
  [rest: string]: any;
};

export default function SpinnerButton({
  spinnerProps,
  loading,
  children,
  className,
  ...rest
}: SpinnerButtonTypes) {
  if (loading) {
    return (
      <button
        aria-label="Loading..."
        className={`spinner-button btn ${className ? className : ''}`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...rest.style
        }}
        {...rest}
        disabled
      >
        <span {...spinnerProps} className="spinner-border" />
      </button>
    );
  }

  return (
    <button className={`btn ${className ? className : ''}`} {...rest}>
      {children}
    </button>
  );
}
