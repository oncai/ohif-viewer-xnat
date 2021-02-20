import React from 'react';
import cornerstone from 'cornerstone-core';
import { commandsManager } from '@ohif/viewer/src/App';

import './XNATViewportOverlay.styl';

class XNATSmooth extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      smooth: true,
    };

    this.element = React.createRef()

    this.onToggleClick = this.onToggleClick.bind(this);
  }

  componentDidMount() {
    this.element.current.addEventListener('mousedown', this, false);
    this.element.current.addEventListener('touchstart', this, false);
  }

  handleEvent(evt) {
    // Don't propagate to parent (csTools via viewport)
    evt.stopPropagation();
  }

  onToggleClick({ target }) {
    const { smooth } = this.state;
    this.setState({ smooth: !smooth });

    // let viewportIndex = window.store.getState().viewports.activeViewportIndex;
    const dom = commandsManager.runCommand('getActiveViewportEnabledElement');
    const enabledElement = cornerstone.getEnabledElement(dom);
    enabledElement.viewport.pixelReplication = smooth;
    cornerstone.updateImage(enabledElement.element);
  }

  render() {
    const { smooth } = this.state;

    return (
      <div ref={this.element}>
        Smooth
        <input
          className="smoothCheckbox"
          type="checkbox"
          name="smooth"
          tabIndex="-1"
          checked={smooth}
          onChange={this.onToggleClick}
          // onTouchEnd={this.onToggleClick}
        />
      </div>
    );
  }
}

export default XNATSmooth;
