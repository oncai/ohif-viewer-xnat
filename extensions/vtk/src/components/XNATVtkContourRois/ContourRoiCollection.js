import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { DATA_IMPORT_STATUS } from '@xnat-ohif/extension-xnat';
import ColoredCircle from './ColoredCircle';

/**
 * @class ContourRoiCollection - Renders metadata for an individual locked
 * ROIContour Collection.
 */
export default class ContourRoiCollection extends React.Component {
  static propTypes = {
    collectionId: PropTypes.string.isRequired,
  };

  static defaultProps = {};

  constructor(props = {}) {
    super(props);

    const { collectionId, SeriesInstanceUID } = props;

    this._structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collectionId
    );

    const {
      visible: collectionVisible,
      expanded,
      ROIContourCollection,
      activeColorTemplate,
    } = this._structureSet;
    this._ROIContourArray = ROIContourCollection;

    const contourRoiVisible = {};
    const contourRoiImportStatus = {};
    ROIContourCollection.forEach(roi => {
      contourRoiVisible[roi.uid] = roi.visible;
      contourRoiImportStatus[roi.uid] = roi.importStatus;
    });

    this.state = {
      expanded,
      collectionVisible,
      contourRoiVisible,
      contourRoiImportStatus,
      activeColorTemplate,
    };

    this.onToggleExpandClick = this.onToggleExpandClick.bind(this);
    this.onCollectionShowHideClick = this.onCollectionShowHideClick.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
    this.onLoadRoiClick = this.onLoadRoiClick.bind(this);
    this.onLoadRoiComplete = this.onLoadRoiComplete.bind(this);
    this.onLoadAllRoiClick = this.onLoadAllRoiClick.bind(this);
    this.onCollectionColorTemplateChanged = this.onCollectionColorTemplateChanged.bind(
      this
    );

    document.addEventListener(
      'xnatcontourroiconvertedtomesh',
      this.onLoadRoiComplete
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'xnatcontourroiconvertedtomesh',
      this.onLoadRoiComplete
    );
  }

  /**
   * onToggleExpandClick - Callback that toggles the expands/collapses the
   * list of collection metadata.
   *
   * @returns {null}
   */
  onToggleExpandClick() {
    const { expanded } = this.state;

    this._structureSet.expanded = !expanded;
    this.setState({ expanded: !expanded });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onCollectionShowHideClick() {
    const { collectionVisible } = this.state;

    this._structureSet.visible = !collectionVisible;
    this.setState({ collectionVisible: !collectionVisible });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick(roiId) {
    const { contourRoiVisible } = this.state;

    const contourRoi = this._ROIContourArray.find(roi => roi.uid === roiId);

    if (contourRoi) {
      const visible = contourRoiVisible[roiId];

      contourRoi.visible = contourRoiVisible[roiId] = !visible;
      this.setState({ contourRoiVisible: contourRoiVisible });
    }
  }

  onLoadRoiClick(uid, loadFunc) {
    // const { contourRoiImportStatus } = this.state;
    // contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTING;
    // this.setState({ contourRoiImportStatus });
    // loadFunc(uid);
  }

  onLoadRoiComplete(evt) {
    const { structUid, roiUid } = evt.detail;
    const { contourRoiImportStatus } = this.state;

    if (this._structureSet.uid !== structUid) {
      return;
    }

    // if (Object.keys(contourRoiImportStatus).includes(roiUid)) {
    //   contourRoiImportStatus[roiUid] = DATA_IMPORT_STATUS.IMPORTED;
    //   const someRoisNotLoaded = Object.values(contourRoiImportStatus).some(
    //     value => value === DATA_IMPORT_STATUS.NOT_IMPORTED
    //   );
    //   this.setState({ contourRoiImportStatus, someRoisNotLoaded });
    // }
  }

  onLoadAllRoiClick() {
    const { contourRoiImportStatus } = this.state;

    // let updateState = false;
    // this._ROIContourArray.forEach(roi => {
    //   const { uid, loadFunc } = roi;
    //   if (contourRoiImportStatus[uid] === DATA_IMPORT_STATUS.NOT_IMPORTED) {
    //     contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTING;
    //     loadFunc(uid);
    //     updateState = true;
    //   }
    // });

    // if (updateState) {
    //   this.setState({ contourRoiImportStatus });
    // }
  }

  onCollectionColorTemplateChanged(evt) {
    const value = evt.target.value;

    const { collectionId, SeriesInstanceUID } = this.props;

    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collectionId
    );

    modules.freehand3D.setters.updateStructureSetColorTemplate(
      structureSet,
      value
    );

    this.setState({ activeColorTemplate: value });
  }

  render() {
    const {
      expanded,
      collectionVisible,
      contourRoiVisible,
      contourRoiImportStatus,
      someRoisNotLoaded,
      activeColorTemplate,
    } = this.state;

    const { uid: collectionUid, name: collectionName } = this._structureSet;

    const expandStyle = expanded ? {} : { transform: 'rotate(90deg)' };

    const listBody = this._ROIContourArray.map(contourRoi => {
      const { uid, color, name, polygonCount } = contourRoi;
      const importStatus = contourRoiImportStatus[uid];
      const isLoaded = importStatus === DATA_IMPORT_STATUS.IMPORTED;

      let indexComponent = <ColoredCircle color={color} />;
      if (importStatus === DATA_IMPORT_STATUS.NOT_IMPORTED) {
        indexComponent = (
          <button
            className="small"
            // onClick={() => this.onLoadRoiClick(uid, loadFunc)}
            title="Load ROI in 3D MPR"
          >
            <Icon
              name="xnat-load-roi"
              style={{ width: 18, height: 18, fill: color }}
            />
          </button>
        );
      }

      return (
        <tr key={uid}>
          <td className="centered-cell">{indexComponent}</td>
          <td className="left-aligned-cell">{name}</td>
          <td className="centered-cell">
            <button className="small" title={!isLoaded ? 'ROI not loaded' : ''}>
              {polygonCount}
            </button>
          </td>
          <td>
            <button
              className="small"
              onClick={() => (isLoaded ? this.onShowHideClick(uid) : null)}
              disabled={!isLoaded}
              title={!isLoaded ? 'ROI not loaded' : ''}
            >
              <Icon name={contourRoiVisible[uid] ? 'eye' : 'eye-closed'} />
            </button>
          </td>
        </tr>
      );
    });

    return (
      <div className="collectionSection">
        <div className={`header${expanded ? ' expanded' : ''}`}>
          <h5>{collectionName}</h5>
          <div className="icons">
            <Icon
              name="xnat-load-roi"
              className="icon"
              width="20px"
              height="20px"
              onClick={this.onLoadAllRoiClick}
              title="Load All Contour ROIs"
            />
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
              onClick={this.onToggleExpandClick}
            />
          </div>
        </div>

        {expanded && (
          <>
            <div className="header subHeading">
              <Icon
                name="xnat-colormap"
                width="18px"
                height="18px"
                title="Active Color Template"
              />
              <select
                value={activeColorTemplate}
                onChange={this.onCollectionColorTemplateChanged}
              >
                {Object.keys(ROI_COLOR_TEMPLATES).map(key => {
                  return (
                    <option key={key} value={key}>
                      {key === ROI_COLOR_TEMPLATES.CUSTOM.id
                        ? 'Auto-Generated'
                        : ROI_COLOR_TEMPLATES[key].desc}
                    </option>
                  );
                })}
              </select>
            </div>
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
