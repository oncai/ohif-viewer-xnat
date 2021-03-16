import React from 'react';
import PropTypes from 'prop-types';
import WorkingCollectionListItem from './WorkingCollectionListItem.js';
import { Icon } from '@ohif/ui';

import '../XNATRoiPanel.styl';
import csTools from 'cornerstone-tools';

const modules = csTools.store.modules;

/**
 * @class WorkingRoiCollectionList - Renders a list of
 * WorkingCollectionListItem, displaying metadata of the working ROIContour
 * Collection.
 */
export default class WorkingRoiCollectionList extends React.Component {
  static propTypes = {
    workingCollection: PropTypes.any,
    activeROIContourIndex: PropTypes.any,
    onRoiChange: PropTypes.any,
    onRoiRemove: PropTypes.any,
    SeriesInstanceUID: PropTypes.any,
    onContourClick: PropTypes.func,
    onRoiCollectionNameChange: PropTypes.func,
    onNewRoiButtonClick: PropTypes.func,
  };

  static defaultProps = {
    workingCollection: undefined,
    activeROIContourIndex: undefined,
    onRoiChange: undefined,
    onRoiRemove: undefined,
    SeriesInstanceUID: undefined,
    onContourClick: undefined,
    onRoiCollectionNameChange: undefined,
    onNewRoiButtonClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    this.state = {
      isExpanded: true,
    };
  }

  render() {
    const {
      workingCollection,
      activeROIContourIndex,
      onRoiChange,
      onRoiRemove,
      SeriesInstanceUID,
      onContourClick,
      onNewRoiButtonClick,
      onRoiCollectionNameChange,
    } = this.props;

    const {
      isExpanded
    } = this.state;

    // default structurset
    const defaultStructureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID
    );
    const defaultStructureSetName =
      defaultStructureSet.name === '_' ? '' : defaultStructureSet.name;

    return (
      <React.Fragment>
        <div className="collectionSection">
          <div className="header">
            <h5 style={{ flex: 1, marginRight: 5, marginLeft: 2 }}>
              <input
                name="roiContourName"
                className="roiEdit"
                onChange={onRoiCollectionNameChange}
                type="text"
                autoComplete="off"
                defaultValue={defaultStructureSetName}
                placeholder="Unnamed ROI collection"
                tabIndex="1"
              />
            </h5>
            <div className="icons">
              <button onClick={onNewRoiButtonClick}>
                <Icon name="xnat-tree-plus" /> Contour ROI
              </button>
              <Icon
                name={`angle-double-${isExpanded ? 'down' : 'up'}`}
                className="icon"
                width="20px"
                height="20px"
                onClick={() => {
                  this.setState({ isExpanded: !isExpanded });
                }}
              />
            </div>
          </div>

          {isExpanded &&
            <div>
              <table className="collectionTable">
                <thead>
                  <tr>
                    <th width="5%" className="centered-cell">
                      #
                    </th>
                    <th width="55%" className="left-aligned-cell">
                      ROI Name
                    </th>
                    <th width="10%" className="centered-cell">
                      N
                    </th>
                    <th width="10%" className="centered-cell" />
                    <th width="10%" className="centered-cell" />
                  </tr>
                </thead>
                <tbody>
                  {SeriesInstanceUID && workingCollection.map(roiContour => (
                    <WorkingCollectionListItem
                      key={roiContour.metadata.uid}
                      roiContourIndex={roiContour.index}
                      metadata={roiContour.metadata}
                      activeROIContourIndex={activeROIContourIndex}
                      onRoiChange={onRoiChange}
                      onRoiRemove={onRoiRemove}
                      SeriesInstanceUID={SeriesInstanceUID}
                      onClick={onContourClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      </React.Fragment>
    );
  }
}
