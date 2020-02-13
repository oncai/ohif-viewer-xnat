import React from 'react';
import MenuIOButtons from './common/MenuIOButtons.js';

//import SegmentationMenuDeleteConfirmation from './SegmentationMenuDeleteConfirmation.js';
import SegmentationMenuListBody from './XNATSegmentationMenu/SegmentationMenuListBody.js';
import SegmentationMenuListHeader from './XNATSegmentationMenu/SegmentationMenuListHeader.js';
import BrushSettings from './XNATSegmentationMenu/BrushSettings.js';
import cornerstoneTools from 'cornerstone-tools';
import { editSegmentInput } from './XNATSegmentationMenu/utils/segmentationMetadataIO.js';
import onIOCancel from './common/helpers/onIOCancel.js';
import generateSegmentationMetadata from '../peppermint-tools/utils/generateSegmentationMetadata';
import { utils } from '@ohif/core';

import './XNATSegmentationPanel.css';

const { studyMetadataManager } = utils;
const segmentationModule = cornerstoneTools.getModule('segmentation');
const segmentationState = segmentationModule.state;
const { getToolState } = cornerstoneTools;

const _getFirstImageId = ({ studyInstanceUid, displaySetInstanceUid }) => {
  try {
    const studyMetadata = studyMetadataManager.get(studyInstanceUid);
    const displaySet = studyMetadata.findDisplaySet(
      displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
    );
    return displaySet.images[0].getImageId();
  } catch (error) {
    console.error('Failed to retrieve image metadata');
    return null;
  }
};

const _getElementFromFirstImageId = firstImageId => {
  const enabledElements = cornerstone.getEnabledElements();

  for (let i = 0; i < enabledElements.length; i++) {
    const enabledElement = enabledElements[0];
    const { element } = enabledElement;
    debugger;
    const stackState = getToolState(element, 'stack');
    const stackData = stackState.data[0];
    const firstImageIdOfEnabledElement = stackData.imageIds[0];

    if (firstImageIdOfEnabledElement === firstImageId) {
      return element;
    }
  }
};

//import './segmentationMenu.styl';

/**
 * @class XNATSegmentationPanel - Renders a menu for importing, exporting, creating
 * and renaming Segments. As well as setting configuration settings for
 * the Brush tools.
 */
export default class XNATSegmentationPanel extends React.Component {
  constructor(props = {}) {
    super(props);

    this.onSegmentChange = this.onSegmentChange.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onIOComplete = this.onIOComplete.bind(this);
    this.onNewSegment = this.onNewSegment.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this.getSegmentList = this.getSegmentList.bind(this);
    this.refreshSegmentList = this.refreshSegmentList.bind(this);
    this.cornerstoneEventListenerHandler = this.cornerstoneEventListenerHandler.bind(
      this
    );

    const { viewports, activeIndex } = props;
    const firstImageId = _getFirstImageId(viewports[activeIndex]);

    let segments = [];
    let activeSegmentIndex = 1;
    let labelmap3D;
    const importMetadata = this.constructor._importMetadata(firstImageId);

    if (firstImageId) {
      const segmentList = this.getSegmentList(firstImageId);

      segments = segmentList.segments;
      activeSegmentIndex = segmentList.activeSegmentIndex;
      labelmap3D = segmentList.labelmap3D;
    }

    this.state = {
      importMetadata,
      segments,
      firstImageId,
      activeSegmentIndex,
      importing: false,
      exporting: false,
      labelmap3D,
    };

    this.addEventListeners();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.removeEventListeners();

    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.addEventListener(
        'peppermintautosegmentgenerationevent',
        this.cornerstoneEventListenerHandler
      );
    });
  }

  removeEventListeners() {
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.removeEventListener(
        'peppermintautosegmentgenerationevent',
        this.cornerstoneEventListenerHandler
      );
    });
  }

  cornerstoneEventListenerHandler() {
    debugger;
    this.refreshSegmentList(this.firstImageId);
  }

  refreshSegmentList(firstImageId) {
    let segments = [];
    let activeSegmentIndex = 1;
    let labelmap3D;
    const importMetadata = this.constructor._importMetadata(firstImageId);

    if (firstImageId) {
      const segmentList = this.getSegmentList(firstImageId);

      segments = segmentList.segments;
      activeSegmentIndex = segmentList.activeSegmentIndex;
      labelmap3D = segmentList.labelmap3D;
    }

    this.setState({
      importMetadata,
      segments,
      firstImageId,
      activeSegmentIndex,
      importing: false,
      exporting: false,
      labelmap3D,
    });
  }

  componentDidUpdate() {
    const { viewports, activeIndex } = this.props;

    if (!viewports) {
      return;
    }

    const firstImageId = _getFirstImageId(viewports[activeIndex]);

    if (firstImageId !== this.state.firstImageId) {
      this.refreshSegmentList(firstImageId);
    }
  }

  /**
   * getSegmentList - Grabs the segments from the brushStore and
   * populates state.
   *
   * @returns {null}
   */
  getSegmentList(firstImageId) {
    const segments = this.constructor._segments(firstImageId);
    const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);
    const labelmap3D = this._getLabelmap3D(firstImageId);

    return {
      segments,
      activeSegmentIndex,
      labelmap3D,
    };
  }

  _getActiveSegmentIndex(firstImageId) {
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return [];
    }

    debugger;

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return 0;
    }

    return labelmap3D.activeSegmentIndex;
  }

  /**
   * onIOComplete - A callback executed on succesful completion of an
   * IO opperation. Recalculates the Segmentation state.
   *
   * @returns {type}  description
   */
  onIOComplete() {
    const { firstImageId } = this.state;

    const importMetadata = this.constructor._importMetadata(firstImageId);
    const segments = this.constructor._segments(firstImageId);

    const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);

    this.setState({
      importMetadata,
      segments,
      activeSegmentIndex,
      importing: false,
      exporting: false,
    });
  }

  onNewSegment() {
    let { labelmap3D, firstImageId } = this.state;

    const newMetadata = generateSegmentationMetadata('Unnamed Segment');

    if (labelmap3D) {
      const { metadata } = labelmap3D;
      let segmentAdded = false;

      debugger;

      // Start from 1, as label 0 is an empty segment.
      for (let i = 1; i < metadata.length; i++) {
        if (!metadata[i]) {
          metadata[i] = newMetadata;
          segmentAdded = true;
          labelmap3D.activeSegmentIndex = i;
          break;
        }
      }

      if (!segmentAdded) {
        metadata.push(newMetadata);
        labelmap3D.activeSegmentIndex = metadata.length - 1;
      }
    } else {
      const element = _getElementFromFirstImageId(firstImageId);

      const labelmapData = segmentationModule.getters.labelmap2D(element);

      labelmap3D = labelmapData.labelmap3D;

      const { metadata } = labelmap3D;

      metadata[1] = newMetadata;
      labelmap3D.activeSegmentIndex = 1;
    }

    const segments = this.constructor._segments(firstImageId);
    const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);

    debugger;

    this.setState({
      segments,
      activeSegmentIndex,
      labelmap3D,
    });
  }

  /**
   * onSegmentChange - Callback that changes the active segment being drawn.
   *
   * @param  {Number} segmentIndex The index of the segment to set active.
   * @returns {null}
   */
  onSegmentChange(segmentIndex) {
    const { labelmap3D } = this.state;

    labelmap3D.activeSegmentIndex = segmentIndex;

    this.setState({ activeSegmentIndex: segmentIndex });
  }

  /**
   * onEditClick - A callback that triggers metadata input for a segment.
   *
   * @param  {Number} segmentIndex The index of the segment metadata to edit.
   * @param  {object}   metadata     The current metadata of the segment.
   * @returns {null}
   */
  onEditClick(segmentIndex, metadata) {
    editSegmentInput(segmentIndex, metadata);
  }

  /**
   * onDeleteClick - A callback that deletes a segment form the series.
   *
   * @returns {null}
   */
  onDeleteClick(segment) {
    const { firstImageId } = this.state;
    const element = _getElementFromFirstImageId(firstImageId);

    segmentationModule.setters.deleteSegment(element, segment);

    const segments = this.constructor._segments(firstImageId);

    this.setState({
      segments,
    });
  }

  /**
   * _importMetadata - Returns the import metadata for the active series.
   *
   * @returns {object} The importMetadata.
   */
  static _importMetadata(firstImageId) {
    const importMetadata = segmentationModule.getters.importMetadata(
      firstImageId
    );

    if (importMetadata) {
      return {
        label: importMetadata.label,
        type: importMetadata.type,
        name: importMetadata.name,
        modified: importMetadata.modified ? 'true' : ' false',
      };
    }

    return {
      name: 'New Segmentation Collection',
      label: '',
    };
  }

  _getLabelmap3D(firstImageId) {
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return;
    }

    return brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];
  }

  /**
   * _segments - Returns an array of segment metadata for the active series.
   *
   * @returns {object[]} An array of segment metadata.
   */
  static _segments(firstImageId) {
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return [];
    }

    debugger;

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return [];
    }

    const metadata = labelmap3D.metadata;

    if (!metadata) {
      return [];
    }

    const segments = [];

    for (let i = 0; i < metadata.length; i++) {
      if (metadata[i]) {
        segments.push({
          index: i,
          metadata: metadata[i],
        });
      }
    }

    return segments;
  }

  render() {
    const {
      importMetadata,
      segments,
      activeSegmentIndex,
      importing,
      exporting,
      firstImageId,
      labelmap3D,
    } = this.state;

    const { ImportCallbackOrComponent, ExportCallbackOrComponent } = this.props;

    let component;

    if (importing) {
      component = (
        <ImportCallbackOrComponent
          onImportComplete={this.onIOComplete}
          onImportCancel={this.onIOCancel}
        />
      );
    } else if (exporting) {
      component = (
        <ExportCallbackOrComponent
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
        />
      );
    } else {
      component = (
        <div className="segmentation-menu-component">
          <div className="segmentation-menu-list">
            <div className="segmentation-menu-header">
              <h3>Segments</h3>
              <MenuIOButtons
                ImportCallbackOrComponent={ImportCallbackOrComponent}
                ExportCallbackOrComponent={ExportCallbackOrComponent}
                onImportButtonClick={() => this.setState({ importing: true })}
                onExportButtonClick={() => this.setState({ exporting: true })}
              />
            </div>
            <table className="peppermint-table">
              <tbody>
                <SegmentationMenuListHeader importMetadata={importMetadata} />
                <SegmentationMenuListBody
                  segments={segments}
                  activeSegmentIndex={activeSegmentIndex}
                  onSegmentChange={this.onSegmentChange}
                  onEditClick={this.onEditClick}
                  onDeleteClick={this.onDeleteClick} //onDeleteClick={this.confirmDeleteOnDeleteClick}
                  onNewSegment={this.onNewSegment}
                  firstImageId={firstImageId}
                  labelmap3D={labelmap3D}
                />
              </tbody>
            </table>
          </div>
          <BrushSettings />
        </div>
      );
    }

    return <React.Fragment>{component}</React.Fragment>;
  }
}
