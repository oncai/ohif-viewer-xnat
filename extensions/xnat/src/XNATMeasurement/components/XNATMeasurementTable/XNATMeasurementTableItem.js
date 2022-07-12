import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import showModal from '../../../components/common/showModal';
import { onShowSingleMeasurement } from '../../utils/actionFunctions';
import MeasurementPropertyModal from '../MeasurementPropertyModal/MeasurementPropertyModal';
import getAnatomyCoding from '../../utils/getAnatomyCoding';

const _getCodingText = ({ category, type, modifier }) => {
  let typeWithModifier = type;

  if (modifier) {
    typeWithModifier += ` (${modifier})`;
  }

  return `${typeWithModifier} - ${category}`;
};

const _onEditClick = (metadata, onEditUpdate) => {
  const onUpdateProperty = data => {
    const { label, description, categoryUID, typeUID, modifierUID } = data;
    metadata.label = label;
    metadata.description = description;
    metadata.codingSequence[0] = getAnatomyCoding({
      categoryUID,
      typeUID,
      modifierUID,
    });
    onEditUpdate();
  };

  showModal(
    MeasurementPropertyModal,
    { metadata, onUpdateProperty },
    metadata.label
  );
};

const XNATMeasurementTableItem = props => {
  const {
    measurement,
    selected,
    onItemClick,
    onItemRemove,
    onJumpToItem,
    onResetViewport,
  } = props;
  const { xnatMetadata, visible } = measurement;
  const {
    label,
    description,
    displayFunction,
    codingSequence,
    icon,
  } = xnatMetadata;

  const [state, setState] = useState({
    visible: visible,
    coding: {
      category: codingSequence[0].CategoryCodeSequence.CodeMeaning,
      type: codingSequence[0].TypeCodeSequence.CodeMeaning,
      modifier:
        codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence &&
        codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence.CodeMeaning,
    },
  });

  const codingText = _getCodingText({
    category: state.coding.category,
    type: state.coding.type,
    modifier: state.coding.modifier,
  });

  const onEditUpdate = () => {
    setState({
      ...state,
      coding: {
        category: codingSequence[0].CategoryCodeSequence.CodeMeaning,
        type: codingSequence[0].TypeCodeSequence.CodeMeaning,
        modifier:
          codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence &&
          codingSequence[0].TypeCodeSequence.TypeModifierCodeSequence
            .CodeMeaning,
      },
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
            _onEditClick(measurement.xnatMetadata, onEditUpdate);
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
            onItemRemove(measurement);
          }}
        />
      </button>
    </>
  );

  return (
    <tr
      onClick={event => {
        event.stopPropagation();
        onItemClick(measurement);
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
        <Icon name={icon} width="16px" height="16px" />
      </td>
      <td className="left-aligned-cell" style={{ cursor: 'pointer' }}>
        <span style={{ color: 'var(--text-primary-color)' }}>{label}</span>
        <span
          style={{ color: 'var(--text-secondary-color)', display: 'block' }}
        >
          {`${description ? description : '...'}`}
        </span>
        <span
          style={{ color: 'var(--text-secondary-color)', display: 'block' }}
        >
          {codingText}
        </span>
        <div className={'rowActions' + (selected ? ' selected' : '')}>
          {actionButtons}
        </div>
      </td>
      <td className="centered-cell">{displayFunction(xnatMetadata)}</td>
      <td className="centered-cell">
        <button
          className="small"
          onClick={event => {
            event.stopPropagation();
            onShowSingleMeasurement(measurement);
            setState({ ...state, visible: !state.visible });
          }}
        >
          {state.visible ? (
            <Icon name="eye" width="16px" height="16px" />
          ) : (
            <Icon name="eye-closed" width="16px" height="16px" />
          )}
        </button>
      </td>
    </tr>
  );
};

XNATMeasurementTableItem.propTypes = {
  measurement: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onItemClick: PropTypes.func.isRequired,
  onItemRemove: PropTypes.func.isRequired,
  onJumpToItem: PropTypes.func.isRequired,
  onResetViewport: PropTypes.func.isRequired,
};

export default XNATMeasurementTableItem;
