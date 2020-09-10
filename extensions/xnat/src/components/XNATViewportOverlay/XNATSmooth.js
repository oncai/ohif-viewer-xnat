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

    this.onToggleClick = this.onToggleClick.bind(this);
  }

  onToggleClick({ target }) {
    const smooth = this.state.smooth;
    this.setState({ smooth: !smooth });

    // let viewportIndex = window.store.getState().viewports.activeViewportIndex;
    const dom = commandsManager.runCommand('getActiveViewportEnabledElement');
    const enabledElement = cornerstone.getEnabledElement(dom);
    enabledElement.viewport.pixelReplication = smooth;
    cornerstone.updateImage(enabledElement.element);
  }

  render() {
    return (
      <div>
        Smooth
        <input
          className="smoothCheckbox"
          type="checkbox"
          name="smooth"
          checked={this.state.smooth}
          onChange={this.onToggleClick}
        />
      </div>
    );
  }
}

export default XNATSmooth;
