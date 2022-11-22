import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { toggleVisibility } from '../../utils';
import getCodingText from '../common/getCodingText';
import MeasurementJumpToButton from '../MeasurementJumpToButton/MeasurementJumpToButton';

const ImportedCollectionItem = props => {
  const { measurement, onJumpToItem } = props;
  const { metadata, internal } = measurement;
  const { uuid, name, description, codingSequence, visible, color } = metadata;
  const { icon, displaySetInstanceUID, collectionUID } = internal;

  const [isVisible, setVisible] = useState(visible);

  const codingText = getCodingText({
    category: codingSequence[0].CategoryCodeSequence.CodeMeaning,
    type: codingSequence[0].TypeCodeSequence.CodeMeaning,
    modifier:
      codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence &&
      codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence.CodeMeaning,
  });

  return (
    <tr>
      <td
        className="centered-cell"
        onClick={event => {
          event.stopPropagation();
        }}
      >
        <MeasurementJumpToButton
          icon={icon}
          color={color}
          onClick={switchViewport => onJumpToItem(measurement, switchViewport)}
        />
      </td>
      <td
        className="left-aligned-cell"
        style={{
          cursor: 'pointer',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <span
          style={{ color: 'var(--text-primary-color)' }}
          title="Measurement name"
        >
          {name}
        </span>
        <span
          style={{ color: 'var(--text-secondary-color)', display: 'block' }}
          title="Description"
        >
          {`${description ? description : '...'}`}
        </span>
        <span
          style={{
            color: 'var(--text-secondary-color)',
            display: 'block',
            fontWeight: 'bold',
          }}
          title="Coding"
        >
          {codingText}
        </span>
      </td>
      <td className="centered-cell">{measurement.displayText}</td>
      <td className="centered-cell">
        <button
          className="small"
          onClick={event => {
            event.stopPropagation();
            toggleVisibility.item(uuid, displaySetInstanceUID, collectionUID);
            setVisible(!isVisible);
          }}
        >
          {isVisible ? (
            <Icon name="eye" width="16px" height="16px" />
          ) : (
            <Icon name="eye-closed" width="16px" height="16px" />
          )}
        </button>
      </td>
    </tr>
  );
};

ImportedCollectionItem.propTypes = {
  measurement: PropTypes.object.isRequired,
  onJumpToItem: PropTypes.func.isRequired,
};

export default ImportedCollectionItem;
