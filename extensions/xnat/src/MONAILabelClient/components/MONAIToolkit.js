import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { MONAI_MODEL_TYPES } from '../api';
import { MONAI_TOOL_TYPES } from '../monailabel-tools';

import '../../components/XNATRoiPanel.styl';

const modules = csTools.store.modules;

export default class MONAIToolkit extends React.Component {
  static propTypes = {
    serverUrl: PropTypes.string,
    models: PropTypes.array,
    onToolUpdate: PropTypes.func,
    onClearPoints: PropTypes.func,
    onRunModel: PropTypes.func,
  };

  static defaultProps = {
    serverUrl: undefined,
    models: [],
    onToolUpdate: undefined,
    onClearPoints: undefined,
    onRunModel: undefined,
  };

  constructor(props = {}) {
    super(props);

    this._monaiClient = modules.monai.client;

    this.state = {
      currentTool: this._monaiClient.currentTool,
      currentModel: this._monaiClient.currentModel,
    };

    this.onAiaaToolChange = this.onAiaaToolChange.bind(this);
    this.filterModelsForCurrentTool = this.filterModelsForCurrentTool.bind(
      this
    );
    this.onAiaaModelChange = this.onAiaaModelChange.bind(this);
  }

  onAiaaToolChange = evt => {
    const value = evt.target.value;
    this._monaiClient.currentTool = MONAI_TOOL_TYPES[value];
    this.setState({ currentTool: this._monaiClient.currentTool });

    this.props.onToolUpdate();
  };

  onAiaaModelChange = evt => {
    const { models } = this.props;
    const value = evt.target.value;
    this._monaiClient.currentModel = models.filter(model => {
      return model.name === value;
    })[0];

    this.setState({ currentModel: this._monaiClient.currentModel });
  };

  filterModelsForCurrentTool = () => {
    const { currentTool } = this.state;
    const { models } = this.props;
    const toolModels = models.filter(model => {
      return model.type === currentTool.type;
    });

    if (toolModels === undefined || toolModels.length === 0) {
      this._monaiClient.currentModel = null;
      return (
        <div className="footerSectionItem" style={{ marginTop: 0 }}>
          <p style={{ color: 'var(--snackbar-error)' }}>
            MONAILabel server has no available models for this tool.
          </p>
        </div>
      );
    }

    if (this._monaiClient.currentModel === null) {
      this._monaiClient.currentModel = toolModels[0];
    } else {
      let modelIndex = toolModels.findIndex(model => {
        return this._monaiClient.currentModel.name === model.name;
      });
      if (modelIndex < 0) {
        modelIndex = 0;
      }
      this._monaiClient.currentModel = toolModels[modelIndex];
    }

    return (
      <React.Fragment>
        <div className="footerSectionItem" style={{ marginTop: 0 }}>
          <label>{`${currentTool.name} models`}</label>
          <select
            onChange={this.onAiaaModelChange}
            defaultValue={this._monaiClient.currentModel.name}
          >
            {toolModels.map((model, key) => (
              <option key={key} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
          {currentTool.type === MONAI_MODEL_TYPES.SEGMENTATION && (
            <button
              style={{ marginLeft: 5 }}
              onClick={() => this.props.onRunModel()}
            >
              Run
            </button>
          )}
        </div>
        <div className="footerSectionItem" style={{ marginTop: 0 }}>
          <p>{this._monaiClient.currentModel.description}</p>
        </div>
        {currentTool.type !== MONAI_MODEL_TYPES.SEGMENTATION && (
          <div
            className="footerSectionItem"
            style={{ marginTop: 0, marginBottom: 10 }}
          >
            <button
              style={{ marginLeft: 'auto' }}
              onClick={() => this.props.onClearPoints(false)}
            >
              Clear segment points
            </button>
            <button
              style={{ marginLeft: 5 }}
              onClick={this.props.onClearPoints}
            >
              Clear all points
            </button>
          </div>
        )}
      </React.Fragment>
    );
  };

  render() {
    const { serverUrl } = this.props;
    const { currentTool } = this.state;
    let currentToolIndex = MONAI_TOOL_TYPES.findIndex(tool => {
      return tool.type === currentTool.type;
    });
    if (currentToolIndex < 0) {
      currentToolIndex = 0;
    }

    const toolSection = this.filterModelsForCurrentTool();

    return (
      <React.Fragment>
        <div className="footerSection" style={{ marginBottom: 5 }}>
          Server URL: {serverUrl}
        </div>
        <div className="footerSection" style={{ marginBottom: 5 }}>
          <div className="footerSectionItem">
            <label htmlFor="monaiToolList">MONAILabel Tool</label>
            <select
              id="monaiToolList"
              onChange={this.onAiaaToolChange}
              defaultValue={currentToolIndex}
            >
              {MONAI_TOOL_TYPES.map((tool, key) => (
                <option key={key} value={key}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          className="footerSection"
          style={{
            border: '2px solid var(--ui-border-color)',
          }}
        >
          <div className="footerSectionItem" style={{ marginTop: 0 }}>
            <p>{currentTool.desc}</p>
          </div>
          {toolSection}
        </div>

        <div className="footerSection" />
      </React.Fragment>
    );
  }
}
