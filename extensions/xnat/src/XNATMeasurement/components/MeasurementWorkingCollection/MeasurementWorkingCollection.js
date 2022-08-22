import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import WorkingCollectionItem from './WorkingCollectionItem';
import { toggleVisibility } from '../../utils';

const MeasurementWorkingCollection = props => {
  const { collection, onItemRemove, onJumpToItem, onResetViewport } = props;
  const { metadata, internal } = collection;

  const [isExpanded, setExpanded] = useState(true);
  const [selectedKey, setSelectedKey] = useState('');
  const [isVisible, setVisible] = useState(internal.visible);
  const [name, setName] = useState(metadata.name);

  const onItemClick = uuid => {
    setSelectedKey(selectedKey === uuid ? '' : uuid);
  };

  const onCollectionNameChange = evt => {
    const value = evt.target.value;
    metadata.name = value;
    setName(value);
  };

  return (
    <div className="collectionSection">
      <div className={`header${isExpanded ? ' expanded' : ''}`}>
        <div
          className="editableWrapper"
          style={{ flex: 1, marginRight: 5, marginLeft: 2 }}
        >
          <input
            name="roiContourName"
            className="roiEdit"
            onChange={onCollectionNameChange}
            type="text"
            autoComplete="off"
            defaultValue={name}
            placeholder="Unnamed measurement collection"
            tabIndex="1"
          />
          <span style={{ position: 'absolute', right: 2, top: 2 }}>
            <Icon name="xnat-pencil" />
          </span>
        </div>
        <div className="icons">
          <Icon
            name={isVisible ? 'eye' : 'eye-closed'}
            className="icon"
            width="20px"
            height="20px"
            onClick={event => {
              toggleVisibility.collection(
                metadata.uuid,
                internal.displaySetInstanceUID
              );
              setVisible(!isVisible);
            }}
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
              <WorkingCollectionItem
                key={measurement.metadata.uuid}
                measurement={measurement}
                selected={measurement.metadata.uuid === selectedKey}
                onItemClick={onItemClick}
                onItemRemove={onItemRemove}
                onJumpToItem={onJumpToItem}
                onResetViewport={onResetViewport}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

MeasurementWorkingCollection.propTypes = {
  collection: PropTypes.object.isRequired,
  onItemRemove: PropTypes.func.isRequired,
  onJumpToItem: PropTypes.func.isRequired,
  onResetViewport: PropTypes.func.isRequired,
};

export default MeasurementWorkingCollection;
