import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { AIAA_TOOL_TYPES, AIAAClient } from '../../aiaa-tools'
import showNotification from '../common/showNotification.js';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;

export default class AIAAToolkit extends React.Component {
  static propTypes = {
    models: PropTypes.array,
  }

  static defaultProps = {
    models: [],
  }

  constructor(props = {}) {
    super(props);

    this.state = {
      currentToolIndex: 0,
    };

    this._currentTool = AIAA_TOOL_TYPES[0];
    this._currentModel = undefined;

    this.onAiaaToolChange = this.onAiaaToolChange.bind(this);
    this.filterModelsForCurrentTool = this.filterModelsForCurrentTool.bind(this);
    this.onAiaaModelChange = this.onAiaaModelChange.bind(this);
  }

  onAiaaToolChange = evt => {
    const value = evt.target.value;
    this._currentTool = AIAA_TOOL_TYPES[value];
    this.setState({ currentToolIndex: value });
  }

  onAiaaModelChange = evt => {
    const { models } = this.props;
    const value = evt.target.value;
    this._currentModel = models.filter(model => {
      return model.name === value;
    })[0];
  }

  filterModelsForCurrentTool = (currentTool) => {
    const { models } = this.props;
    const toolModels = models.filter(model => {
      return model.type === currentTool.type;
    });

    if (toolModels === undefined || toolModels.length === 0) {
      return (
        <div className="footerSectionItem" style={{ marginTop: 0 }}>
          <p style={{ color: 'var(--snackbar-error)' }}>
            AIAA server has no available models for this tool.
          </p>
        </div>
      );
    }

    this._currentModel = toolModels[0];

    return (
      <React.Fragment>
        <div className="footerSectionItem"
             style={{ marginTop: 0 }}>
          <label>{`${currentTool.name} models`}</label>
          <select
            onChange={this.onAiaaModelChange}
          >
            {toolModels.map((model, key) => (
              <option key={key} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
        <div className="footerSectionItem" style={{ marginTop: 0}}>
          <p>{this._currentModel.description}</p>
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { currentToolIndex } = this.state;

    const toolSection =
      this.filterModelsForCurrentTool(this._currentTool);

    return (
      <React.Fragment>
        <div className="footerSection" style={{ marginBottom: 5 }}>
          <div className="footerSectionItem">
            <label htmlFor="aiaaToolList">AIAA Tool</label>
            <select
              id="aiaaToolList"
              onChange={this.onAiaaToolChange}
              defaultValue={currentToolIndex}
            >
              {AIAA_TOOL_TYPES.map((tool, key) => (
                <option key={key} value={key}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="footerSection" style={{
          border: '2px solid var(--ui-border-color)',
        }}>
          <div className="footerSectionItem" style={{ marginTop: 0 }}>
            <p>{this._currentTool.desc}</p>
          </div>
          {toolSection}
        </div>

        <div className="footerSection"/>
      </React.Fragment>
    );
  }
}