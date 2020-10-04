// ToDo: remove - replaced with ContourPanelSettings

import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import refreshViewport from '../../utils/refreshViewport';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;

/**
 * @class RoiContourSettings - A component that allows the user to change
 * configuration of the freehand3D tools.
 */
export default class RoiContourSettings extends React.Component {
  constructor(props = {}) {
    super(props);

    const { interpolate, displayStats } = modules.freehand3D.state;

    this.state = {
      interpolate,
      displayStats,
    };

    this.onDisplayStatsToggleClick = this.onDisplayStatsToggleClick.bind(this);
    this.onInterpolateToggleClick = this.onInterpolateToggleClick.bind(this);
  }

  /**
   * onDisplayStatsToggleClick - A Callback that toggles the display of stats
   * window on the Freehand3DTool.
   *
   * @returns {null}
   */
  onDisplayStatsToggleClick() {
    modules.freehand3D.setters.toggleDisplayStats();

    this.setState({ displayStats: modules.freehand3D.state.displayStats });

    refreshViewport();
  }

  /**
   * onInterpolateToggleClick - A callback that toggles interpolation mode for
   * the Freehand3DTool.
   *
   * @returns {null}
   */
  onInterpolateToggleClick() {
    modules.freehand3D.setters.toggleInterpolate();

    this.setState({ interpolate: modules.freehand3D.state.interpolate });
  }

  render() {
    const { interpolate, displayStats } = this.state;

    return (
      <div className="roiPanelFooter">
        <h3 style={{ marginBottom: 15 }}>Settings</h3>
        <div className="roiPanelMenuOption">
          <input
            type="checkbox"
            name="interpolate"
            onChange={this.onInterpolateToggleClick}
            checked={interpolate}
            value={interpolate}
          />
          <label htmlFor="interpolate"><em>Interpolation</em></label>
        </div>
        <div className="roiPanelMenuOption">
          <input
            type="checkbox"
            name="stats"
            onChange={this.onDisplayStatsToggleClick}
            checked={displayStats}
            value={displayStats}
          />
          <label htmlFor="stats"><em>Stats</em></label>
        </div>
        <div className="roiPanelMenuOption">
        </div>
      </div>
    );
  }
}
