import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import '../XNATRoiPanel.styl';

export default class AIAAMenuSettings extends React.Component {
  static propTypes = {
    settings: PropTypes.object,
    onSave: PropTypes.func,
  }

  static defaultProps = {
    settings: undefined,
    onSave: undefined,
  }

  constructor(props = {}) {
    super(props);

    this._settings = {
      ...props.settings,
    };

    this.onBlurSeverURL = this.onBlurSeverURL.bind(this);
  }

  onBlurSeverURL = evt => {
    this._settings.serverUrl = evt.target.value;
  }

  render() {
    const { settings } = this.props;

    return (
      <div className="footerSection">
        <div className="footerSectionItem">
          <label htmlFor="aiaaServerURL">AIAA server URL</label>
          <input
            id="aiaaServerURL"
            type="text"
            defaultValue={settings.serverUrl}
            onBlur={this.onBlurSeverURL}
          />
        </div>
        <div className="footerSectionItem">
          <button
            onClick={() => {
              this.props.onSave(this._settings)}
            }
            style={{ marginLeft: 'auto' }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }
}