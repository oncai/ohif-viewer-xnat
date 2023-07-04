import React, { memo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import XNATViewportMenuCheckItem from './XNATViewportMenuCheckItem';
import XNATViewportMenuStackSwitch from './XNATViewportMenuStackSwitch';

import './XNATViewportMenu.styl';

const NavButton = props => {
  const { isExpanded, onClick } = props;

  return (
    <button
      className={`ViewportMenuIcon NavButton${isExpanded ? ' isExpanded' : ''}`}
      onClick={onClick}
    >
      {isExpanded ? 'X' : <Icon name="xnat-settings" />}
    </button>
  );
};

const NavButtonWithToggle = props => {
  const { menuRef, setExpanded } = props;
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        menuRef &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, false);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, false);
    };
  }, [setExpanded, menuRef]);

  return <NavButton {...props} />;
};

const XNATViewportMenu = props => {
  const {
    viewportIndex,
    viewportOptions,
    setViewportActive,
    getViewportSpecificData,
    setViewportStackData,
  } = props;

  const [isExpanded, setExpanded] = useState(false);
  const menuRef = useRef(null);

  const updateViewportOptions = optionsObject => {
    props.updateViewportOptions(optionsObject);
    setExpanded(false);
  };

  const updateViewportStackData = data => {
    if (!data) {
      return;
    }
    setViewportStackData(data);
  };

  let stackSwitchMenu = null;
  if (isExpanded) {
    const stackData = getStackData(getViewportSpecificData, viewportIndex);
    if (stackData) {
      stackSwitchMenu = (
        <XNATViewportMenuStackSwitch
          stackData={stackData}
          viewportIndex={viewportIndex}
          updateViewportStackData={updateViewportStackData}
          closeViewportMenu={() => setExpanded(false)}
          setViewportActive={setViewportActive}
        />
      );
    }
  }

  const onClickNavButton = evt => {
    evt.stopPropagation();
    setExpanded(!isExpanded);
  };

  return (
    <div
      className={`XNATViewportMenu${isExpanded ? ' isExpanded' : ''}`}
      style={isExpanded && stackSwitchMenu !== null ? { height: 185 } : {}}
      ref={menuRef}
    >
      {/*Top row*/}
      {isExpanded ? (
        <div className="ViewportMenuRow TitleRow">
          <NavButtonWithToggle
            isExpanded={isExpanded}
            onClick={onClickNavButton}
            setExpanded={setExpanded}
            menuRef={menuRef}
          />
          <div className="ViewportMenuLabel">Viewport Options</div>
        </div>
      ) : (
        <NavButton isexpanded={isExpanded} onClick={onClickNavButton} />
      )}
      {/*Menu*/}
      {isExpanded && (
        <ul className="XNATViewportMenuContent">
          <XNATViewportMenuCheckItem
            property="smooth"
            label="Smooth"
            icon="xnat-smooth"
            isChecked={viewportOptions.smooth}
            onClick={updateViewportOptions}
          />
          <XNATViewportMenuCheckItem
            property="sync"
            label="Sync"
            icon="xnat-sync"
            isChecked={viewportOptions.sync}
            onClick={updateViewportOptions}
          />
          <XNATViewportMenuCheckItem
            property="annotate"
            label="Annotations"
            icon="xnat-annotate"
            isChecked={viewportOptions.annotate}
            onClick={updateViewportOptions}
          />
          <XNATViewportMenuCheckItem
            property="overlay"
            label="Overlay"
            icon="xnat-viewport-overlay"
            isChecked={viewportOptions.overlay}
            onClick={updateViewportOptions}
          />
          {stackSwitchMenu}
        </ul>
      )}
    </div>
  );
};

XNATViewportMenu.propTypes = {
  viewportIndex: PropTypes.number.isRequired,
  viewportOptions: PropTypes.object.isRequired,
  updateViewportOptions: PropTypes.func.isRequired,
  setViewportActive: PropTypes.func.isRequired,
  getViewportSpecificData: PropTypes.func.isRequired,
  setViewportStackData: PropTypes.func.isRequired,
};

XNATViewportMenu.defaultProps = {};

const getStackData = (getViewportSpecificData, viewportIndex) => {
  const viewportSpecificData = getViewportSpecificData();
  if (!viewportSpecificData) {
    return;
  }

  if (viewportSpecificData.isMultiStack || viewportSpecificData.isSubStack) {
    return viewportSpecificData.getSubStackGroupData();
  }
};

export default memo(XNATViewportMenu);
