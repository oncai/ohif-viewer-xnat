import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { toggleVisibility } from '../../utils';
import ImportedCollectionItem from './ImportedCollectionItem';

const MeasurementImportedCollection = props => {
  const {
    collection,
    onJumpToItem,
    onUnlockCollection,
    onRemoveCollection,
  } = props;
  const { metadata, internal } = collection;

  const [isExpanded, setExpanded] = useState(true);
  const [isVisible, setVisible] = useState(internal.visible);

  return (
    <div className="collectionSection">
      <div className={`header${isExpanded ? ' expanded' : ''}`}>
        <h5>{metadata.name}</h5>
        <div className="icons">
          <Icon
            name={isVisible ? 'eye' : 'eye-closed'}
            className="icon"
            width="20px"
            height="20px"
            onClick={event => {
              toggleVisibility.collection(
                internal.displaySetInstanceUID,
                metadata.uuid
              );
              setVisible(!isVisible);
            }}
          />
          <Icon
            name="lock"
            className="icon"
            width="20px"
            height="20px"
            onClick={() => {
              onUnlockCollection(metadata.uuid);
            }}
            title="Unlock Measurement Collection"
          />
          <Icon
            name="trash"
            className="icon"
            width="20px"
            height="20px"
            onClick={() => {
              onRemoveCollection(metadata.uuid);
            }}
            title="Remove Measurement Collection"
          />
          <Icon
            name={`angle-double-${isExpanded ? 'down' : 'up'}`}
            className="icon"
            style={isExpanded ? {} : { transform: 'rotate(90deg)' }}
            width="20px"
            height="20px"
            onClick={() => {
              setExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          />
        </div>
      </div>

      {isExpanded && (
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
            {collection.measurements.map(measurement => (
              <ImportedCollectionItem
                key={measurement.metadata.uuid}
                measurement={measurement}
                onJumpToItem={onJumpToItem}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

MeasurementImportedCollection.propTypes = {
  collection: PropTypes.object.isRequired,
  onJumpToItem: PropTypes.func.isRequired,
  onUnlockCollection: PropTypes.func.isRequired,
  onRemoveCollection: PropTypes.func.isRequired,
};

export default MeasurementImportedCollection;
