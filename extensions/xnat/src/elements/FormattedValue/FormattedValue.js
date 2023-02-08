import React from 'react';

const FormattedValue = ({ prefix, value, suffix, sameLine }) => {
  const style = { color: 'var(--text-secondary-color)' };
  if (!sameLine) {
    style.display = 'block';
  }
  return (
    <div>
      {prefix && <span style={style}>{prefix} </span>}
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
