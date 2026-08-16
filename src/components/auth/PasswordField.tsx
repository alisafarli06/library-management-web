import { useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon } from './icons';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export function PasswordField({ id, label, error, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const toggleId = `${id}-toggle`;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control field__control--toggle">
        <LockIcon />
        <input
          {...inputProps}
          id={id}
          className="field__input"
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <button
          id={toggleId}
          type="button"
          className="field__toggle"
          disabled={inputProps.disabled}
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
