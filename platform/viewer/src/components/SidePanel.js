import './SidePanel.css';

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useAppContext, CONTEXTS } from '../context/AppContext';

const SidePanel = ({ from, isOpen, children, width }) => {
  const fromSideClass = from === 'right' ? 'from-right' : 'from-left';

  // Hide side panels while using VTK
  const { activeContexts } = useAppContext();
  const isVTK = activeContexts.includes(CONTEXTS.VTK);
  if (isVTK) return null;

  const styles = width
    ? {
        maxWidth: width,
        marginRight: isOpen ? '0' : Number.parseInt(width) * -1,
      }
    : {};

  return (
    <section
      style={styles}
      className={classNames('sidepanel', fromSideClass, {
        'is-open': isOpen,
      })}
    >
      {children}
    </section>
  );
};

SidePanel.propTypes = {
  from: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node,
  width: PropTypes.string,
};

export default SidePanel;
