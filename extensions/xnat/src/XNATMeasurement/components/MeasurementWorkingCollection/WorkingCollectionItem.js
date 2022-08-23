import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import getAnatomyCoding from '../../utils/getAnatomyCoding';
import showModal from '../../../components/common/showModal';
import MeasurementPropertyModal from '../MeasurementPropertyModal/MeasurementPropertyModal';
import { toggleVisibility } from '../../utils';

const WorkingCollectionItem = props => {
  const {
    measurement,
    selected,
    onItemClick,
    onItemRemove,
    onJumpToItem,
    onResetViewport,
  } = props;
  const { metadata, internal, csData } = measurement;
  const { uuid, name, description, codingSequence, visible, color } = metadata;
  const { icon, displaySetInstanceUID } = internal;

  const [isVisible, setVisible] = useState(visible);
  const [coding, setCoding] = useState({
    category: codingSequence[0].CategoryCodeSequence.CodeMeaning,
    type: codingSequence[0].TypeCodeSequence.CodeMeaning,
    modifier:
      codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence &&
      codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence.CodeMeaning,
  });

  const codingText = _getCodingText(coding);

  const onCodingUpdated = () => {
    setCoding({
      category: codingSequence[0].CategoryCodeSequence.CodeMeaning,
      type: codingSequence[0].TypeCodeSequence.CodeMeaning,
      modifier:
        codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence &&
        codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence
          .CodeMeaning,
    });
  };

  const actionButtons = (
    <>
      <button className="btnAction">
        <Icon
          name="xnat-pencil"
          width="16px"
          height="16px"
          title="Edit metadata"
          onClick={event => {
            event.stopPropagation();
            _onEditClick(metadata, onCodingUpdated);
          }}
        />
      </button>
      <button className="btnAction">
        <Icon
          name="reset"
          width="16px"
          height="16px"
          title="Reset presentation state"
          onClick={event => {
            event.stopPropagation();
            onResetViewport(measurement);
          }}
        />
      </button>
      <button className="btnAction">
        <Icon name="palette" width="16px" height="16px" title="Change color" />
      </button>
      <button className="btnAction">
        <Icon
          name="trash"
          width="16px"
          height="16px"
          title="Remove"
          onClick={event => {
            event.stopPropagation();
            onItemRemove(csData.measurementReference);
          }}
        />
      </button>
    </>
  );

  return (
    <tr
      onClick={event => {
        event.stopPropagation();
        onItemClick(uuid);
      }}
    >
      <td
        className="centered-cell"
        style={{ cursor: 'pointer' }}
        onClick={event => {
          event.stopPropagation();
          onJumpToItem(measurement);
        }}
      >
        <Icon
          name={icon}
          width="16px"
          height="16px"
          style={{ fill: `${color}`, color: `${color}` }}
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
        <div className={'rowActions' + (selected ? ' selected' : '')}>
          {actionButtons}
        </div>
      </td>
      <td className="centered-cell">{measurement.displayText}</td>
      <td className="centered-cell">
        <button
          className="small"
          onClick={event => {
            event.stopPropagation();
            toggleVisibility.item(uuid, displaySetInstanceUID);
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

WorkingCollectionItem.propTypes = {
  measurement: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onItemClick: PropTypes.func.isRequired,
  onItemRemove: PropTypes.func.isRequired,
  onJumpToItem: PropTypes.func.isRequired,
  onResetViewport: PropTypes.func.isRequired,
};

const _getCodingText = coding => {
  const { category, type, modifier } = coding;
  let typeWithModifier = type;

  if (modifier) {
    typeWithModifier += ` (${modifier})`;
  }

  return `${typeWithModifier} - ${category}`;
};

const _onEditClick = (metadata, onCodingUpdated) => {
  const onUpdateProperty = data => {
    const { name, description, categoryUID, typeUID, modifierUID } = data;
    metadata.name = name;
    metadata.description = description;
    metadata.codingSequence[0] = getAnatomyCoding({
      categoryUID,
      typeUID,
      modifierUID,
    });
    onCodingUpdated();
  };

  showModal(
    MeasurementPropertyModal,
    { metadata, onUpdateProperty },
    metadata.name
  );
};

export default WorkingCollectionItem;
