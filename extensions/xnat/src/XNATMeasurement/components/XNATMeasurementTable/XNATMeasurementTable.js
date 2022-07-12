import React from 'react';
import PropTypes from 'prop-types';
import XNATMeasurementTableItem from './XNATMeasurementTableItem';
import { Icon } from '@ohif/ui';

const XNATMeasurementTable = props => {
  const {
    collection,
    selectedKey,
    onItemClick,
    onItemRemove,
    onJumpToItem,
    onResetViewport,
  } = props;

  return (
    <div className="collectionSection">
      <table className="collectionTable">
        <thead>
          <tr>
            <th width="10%" className="centered-cell" />
            <th width="60%" className="left-aligned-cell">
              Measurement
            </th>
            <th width="20%" className="centered-cell">
              Value
            </th>
            <th width="10%" className="centered-cell" />
          </tr>
        </thead>
        <tbody>
          {collection.map(measurement => (
            <XNATMeasurementTableItem
              key={measurement.uuid}
              measurement={measurement}
              selected={measurement.uuid === selectedKey}
              onItemClick={onItemClick}
              onItemRemove={onItemRemove}
              onJumpToItem={onJumpToItem}
              onResetViewport={onResetViewport}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default XNATMeasurementTable;
