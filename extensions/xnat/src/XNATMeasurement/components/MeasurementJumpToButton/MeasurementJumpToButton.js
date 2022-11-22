import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@ohif/ui';

import './MeasurementJumpToButton.styl';

const MeasurementJumpToButton = props => {
  const { icon, color, onClick } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  const close = () => {
    setIsExpanded(false);
  };
  const wrapperRef = useRef(null);
  useOutsideToggler(wrapperRef, close);

  return (
    <div
      ref={wrapperRef}
      className="jumToContainer"
      title="Jump to slice"
      onClick={event => {
        event.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
    >
      <button>
        <Icon
          name={icon}
          width="16px"
          height="16px"
          style={{ fill: `${color}`, color: `${color}` }}
        />
      </button>
      <Icon name="caret-down" className="optionsCaret" />
      {isExpanded && (
        <ul className="menu">
          <li
            className="menuItem"
            onClick={event => {
              event.stopPropagation();
              close();
              onClick(false);
            }}
          >
            Jump to Slice
          </li>
          <li
            className="menuItem"
            onClick={event => {
              event.stopPropagation();
              close();
              onClick(true);
            }}
          >
            Restore Presentation State
          </li>
        </ul>
      )}
    </div>
  );
};

const useOutsideToggler = (ref, close) => {
  useEffect(() => {
    const handleClickOutside = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, false);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, false);
    };
  }, [close, ref]);
};

export default MeasurementJumpToButton;
