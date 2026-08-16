import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export function TextField({ id, label, error, icon, ...inputProps }: TextFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {icon ? (
        <div className="field__control">
          {icon}
          <input
            id={id}
            className="field__input"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            {...inputProps}
          />
        </div>
      ) : (
        <input
          id={id}
          className="field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...inputProps}
        />
      )}
      {error ? (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
