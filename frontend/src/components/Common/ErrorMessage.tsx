import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title = "Error Encountered", message }) => {
  return (
    <div className="error-banner">
      <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</h4>
      <p style={{ fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
};
