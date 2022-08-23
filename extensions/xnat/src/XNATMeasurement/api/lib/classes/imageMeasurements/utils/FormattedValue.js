import React from 'react';

const FormattedValue = ({ prefix, value, suffix }) => {
  return (
    <div>
      {prefix && (
        <span style={{ color: 'var(--text-secondary-color)', display: 'block' }}>{prefix} </span>
      )}
      <span>{_numbersWithCommas(value)}</span>
      {suffix && (
        <span style={{ color: 'var(--text-secondary-color)' }}> {suffix}</span>
      )}
    </div>
  );
};

const _numbersWithCommas = x => {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export default FormattedValue;
