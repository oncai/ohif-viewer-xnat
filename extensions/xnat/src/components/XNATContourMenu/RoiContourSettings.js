import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';

import '../XNATContourPanel.styl';

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
      <div className="roi-contour-menu-footer">
        <h3>Settings</h3>
        <div
          className="roi-contour-menu-option"
          style={{ cursor: 'select' }}
          onClick={this.onInterpolateToggleClick}
        >
          <label>
            {interpolate ? (
              <Icon name="check" style={{ marginRight: 4 }} />
            ) : (
              <div className="empty-check-box" />
            )}
            <em>Interpolation</em>
          </label>
        </div>
        <div
          className="roi-contour-menu-option"
          style={{ cursor: 'select' }}
          onClick={this.onDisplayStatsToggleClick}
        >
          <label>
            {displayStats ? (
              <Icon name="check" style={{ marginRight: 4 }} />
            ) : (
              <div className="empty-check-box" />
            )}
            <em>Stats</em>
          </label>
        </div>
      </div>
    );
  }
}
