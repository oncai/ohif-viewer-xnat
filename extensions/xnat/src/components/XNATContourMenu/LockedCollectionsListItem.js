import React from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import ColoredCircle from '../common/ColoredCircle';
import ProgressColoredCircle from '../common/ProgressColoredCircle';
import DATA_IMPORT_STATUS from '../../utils/dataImportStatus';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;

/**
 * @class LockedCollectionsListItem - Renders metadata for an individual locked
 * ROIContour Collection.
 */
export default class LockedCollectionsListItem extends React.Component {
  static propTypes = {
    collection: PropTypes.any,
    onUnlockClick: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    collection: undefined,
    onUnlockClick: undefined,
    SeriesInstanceUID: undefined,
    onClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { metadata, ROIContourArray } = props.collection;
    const collectionVisible = metadata.visible;
    const contourRoiVisible = [];
    const contourRoiImportStatus = {};
    ROIContourArray.forEach(roi => {
      contourRoiVisible.push(roi.metadata.visible);
      contourRoiImportStatus[roi.metadata.uid] = roi.metadata.importStatus;
    });

    const someRoisNotLoaded = ROIContourArray.some(roi => {
      return roi.metadata.importStatus === DATA_IMPORT_STATUS.NOT_IMPORTED;
    });

    this.state = {
      expanded: false,
      collectionVisible,
      contourRoiVisible,
      contourRoiImportStatus,
      someRoisNotLoaded,
    };

    this.onToggleVisibilityClick = this.onToggleVisibilityClick.bind(this);
    this.onCollectionShowHideClick = this.onCollectionShowHideClick.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
    this.onLoadRoiClick = this.onLoadRoiClick.bind(this);
    this.onLoadRoiComplete = this.onLoadRoiComplete.bind(this);
    this.onLoadAllRoiClick = this.onLoadAllRoiClick.bind(this);

    document.addEventListener(
      'xnatcontourroiextracted',
      this.onLoadRoiComplete
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'xnatcontourroiextracted',
      this.onLoadRoiComplete
    );
  }

  /**
   * onToggleVisibilityClick - Callback that toggles the expands/collapses the
   * list of collection metadata.
   *
   * @returns {null}
   */
  onToggleVisibilityClick() {
    const { expanded } = this.state;

    this.setState({ expanded: !expanded });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onCollectionShowHideClick() {
    const { collection, SeriesInstanceUID } = this.props;
    const { collectionVisible } = this.state;
    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collection.metadata.uid
    );

    structureSet.visible = !collectionVisible;
    this.setState({ collectionVisible: !collectionVisible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick(index) {
    const { metadata, ROIContourArray } = this.props.collection;
    const { contourRoiVisible } = this.state;

    const contourRoi = ROIContourArray[index];
    const visible = contourRoiVisible[index];

    contourRoi.metadata.visible = contourRoiVisible[index] = !visible;
    this.setState({ contourRoiVisible: contourRoiVisible });

    cornerstone.getEnabledElements().forEach(enabledElement => {
      cornerstone.updateImage(enabledElement.element);
    });
  }

  onLoadRoiClick(uid, loadFunc) {
    const { contourRoiImportStatus } = this.state;
    contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTING;
    this.setState({ contourRoiImportStatus });
    loadFunc(uid);
  }

  onLoadRoiComplete(evt) {
    const uid = evt.detail.uid;
    const { contourRoiImportStatus } = this.state;
    if (Object.keys(contourRoiImportStatus).includes(uid)) {
      contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTED;
      const someRoisNotLoaded = Object.values(contourRoiImportStatus).some(
        value => value === DATA_IMPORT_STATUS.NOT_IMPORTED
      );
      this.setState({ contourRoiImportStatus, someRoisNotLoaded });
    }
  }

  onLoadAllRoiClick() {
    const { collection } = this.props;
    const { contourRoiImportStatus } = this.state;
    const ROIContourArray = collection.ROIContourArray;

    let updateState = false;
    ROIContourArray.forEach(roi => {
      const { uid, loadFunc } = roi.metadata;
      if (contourRoiImportStatus[uid] === DATA_IMPORT_STATUS.NOT_IMPORTED) {
        contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTING;
        loadFunc(uid);
        updateState = true;
      }
    });

    if (updateState) {
      this.setState({ contourRoiImportStatus });
    }
  }

  render() {
    const { collection, onUnlockClick, onClick } = this.props;
    const {
      expanded,
      collectionVisible,
      contourRoiVisible,
      contourRoiImportStatus,
      someRoisNotLoaded,
    } = this.state;

    const metadata = collection.metadata;
    const ROIContourArray = collection.ROIContourArray;

    const expandStyle = expanded ? {} : { transform: 'rotate(90deg)' };

    const listBody = ROIContourArray.map((contourRoi, index) => {
      const {
        uid,
        color,
        name,
        polygonCount,
        importPercent,
        loadFunc,
      } = contourRoi.metadata;
      const importStatus = contourRoiImportStatus[uid];
      const isLoaded = importStatus === DATA_IMPORT_STATUS.IMPORTED;

      let indexComponent = <ColoredCircle color={color} />;
      if (importStatus === DATA_IMPORT_STATUS.NOT_IMPORTED) {
        indexComponent = (
          <button
            className="small"
            onClick={() => this.onLoadRoiClick(uid, loadFunc)}
            title="Load ROI"
          >
            <Icon
              name="xnat-load-roi"
              style={{ width: 18, height: 18, fill: color }}
            />
          </button>
        );
      } else if (importStatus === DATA_IMPORT_STATUS.IMPORTING) {
        indexComponent = (
          <ProgressColoredCircle
            color={color}
            uid={uid}
            percent={importPercent}
          />
        );
      }
      return (
        <tr key={uid}>
          <td className="centered-cell">{indexComponent}</td>
          <td className="left-aligned-cell">{name}</td>
          <td className="centered-cell">
            <button
              className="small"
              onClick={() => (polygonCount && isLoaded ? onClick(uid) : null)}
              disabled={!isLoaded}
              title={!isLoaded ? 'ROI not loaded' : ''}
            >
              {polygonCount}
            </button>
          </td>
          <td>
            <button
              className="small"
              onClick={() => (isLoaded ? this.onShowHideClick(index) : null)}
              disabled={!isLoaded}
              title={!isLoaded ? 'ROI not loaded' : ''}
            >
              <Icon name={contourRoiVisible[index] ? 'eye' : 'eye-closed'} />
            </button>
          </td>
        </tr>
      );
    });

    return (
      <div className="collectionSection">
        <div className="header">
          <h5>{metadata.name}</h5>
          <div className="icons">
            {someRoisNotLoaded && (
              <Icon
                name="xnat-load-roi"
                className="icon"
                width="20px"
                height="20px"
                onClick={this.onLoadAllRoiClick}
                title="Load All Contour ROIs"
              />
            )}
            {!someRoisNotLoaded && (
              <Icon
                name="lock"
                className="icon"
                width="20px"
                height="20px"
                onClick={() => {
                  onUnlockClick(metadata.uid);
                }}
                title="Unlock ROI Collection"
              />
            )}
            <Icon
              name={collectionVisible ? 'eye' : 'eye-closed'}
              className="icon"
              width="20px"
              height="20px"
              onClick={this.onCollectionShowHideClick}
            />
            <Icon
              name={`angle-double-${expanded ? 'down' : 'up'}`}
              className="icon"
              style={expandStyle}
              width="20px"
              height="20px"
              onClick={() => {
                this.setState({ expanded: !expanded });
              }}
            />
          </div>
        </div>

        {expanded && (
          <>
            <table className="collectionTable">
              <thead>
                <tr>
                  <th width="5%" className="centered-cell">
                    #
                  </th>
                  <th width="75%" className="left-aligned-cell">
                    ROI Name
                  </th>
                  <th width="10%" className="centered-cell">
                    N
                  </th>
                  <th width="10%" className="centered-cell" />
                </tr>
              </thead>
              <tbody>{listBody}</tbody>
            </table>
          </>
        )}
      </div>
    );
  }
}
