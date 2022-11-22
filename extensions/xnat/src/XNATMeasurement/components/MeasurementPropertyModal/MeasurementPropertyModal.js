import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GeneralAnatomyList } from '../../../peppermint-tools';

const categories = GeneralAnatomyList.SegmentationCodes.Category;

const MeasurementPropertyModal = props => {
  const { metadata, onUpdateProperty, onClose } = props;
  const coding = metadata.codingSequence[0];

  const [state, setState] = useState({
    name: metadata.name,
    description: metadata.description,
    categoryUID: coding.CategoryCodeSequence.CodeValue,
    typeUID: coding.TypeCodeSequence.CodeValue,
    modifierUID: coding.TypeCodeSequence.TypeModifierCodeSequence
      ? coding.TypeCodeSequence.TypeModifierCodeSequence.CodeValue
      : null,
    validLabel: true,
    validDescription: true,
  });

  const onCategoryChange = evt => {
    const categoryUID = evt.target.value;

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );
    const firstType = category.Type[0];

    const typeUID = firstType.CodeValue;

    let modifierUID = null;

    if (firstType.Modifier) {
      modifierUID = firstType.Modifier[0].CodeValue;
    }

    setState({
      ...state,
      categoryUID,
      typeUID,
      modifierUID,
    });
  };

  const onTypeChange = evt => {
    const { categoryUID } = state;
    const typeUID = evt.target.value;

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );

    const types = category.Type;
    const type = types.find(typesI => typesI.CodeValue === typeUID);

    let modifierUID = null;

    if (type.Modifier) {
      modifierUID = type.Modifier[0].CodeValue;
    }

    setState({
      ...state,
      typeUID,
      modifierUID,
    });
  };

  const onModifierChange = evt => {
    const modifierUID = evt.target.value;

    setState({
      ...state,
      modifierUID,
    });
  };

  const onChangeLabel = evt => {
    const name = evt.target.value;

    setState({
      ...state,
      name,
      validLabel: name.length > 0 && name.length <= 64,
    });
  };

  const onChangeDescription = evt => {
    const description = evt.target.value;

    setState({
      ...state,
      description,
      validDescription: description.length <= 64,
    });
  };

  const categorySelect = (
    <div style={{ marginBottom: 10 }}>
      <label>Category</label>
      <select
        className="form-themed form-control input-overload"
        onChange={onCategoryChange}
        value={state.categoryUID}
      >
        {categories.map(category => (
          <option key={category.CodeValue} value={category.CodeValue}>
            {category.CodeMeaning}
          </option>
        ))}
      </select>
    </div>
  );

  const category = categories.find(
    categoriesI => categoriesI.CodeValue === state.categoryUID
  );
  const types = category.Type;

  const typeSelect = (
    <div style={{ marginBottom: 10 }}>
      <label>Type</label>
      <select
        className="form-themed form-control input-overload"
        onChange={onTypeChange}
        value={state.typeUID}
      >
        {types.map(type => (
          <option key={type.CodeValue} value={type.CodeValue}>
            {type.CodeMeaning}
          </option>
        ))}
      </select>
    </div>
  );

  const type = types.find(typesI => typesI.CodeValue === state.typeUID);

  let modifierSelect = null;

  if (type.Modifier) {
    const modifiers = type.Modifier;

    modifierSelect = (
      <div style={{ marginBottom: 10 }}>
        <label>Modifier</label>
        <select
          className="form-themed form-control input-overload"
          onChange={onModifierChange}
          value={state.modifierUID}
        >
          {modifiers.map(modifier => (
            <option key={modifier.CodeValue} value={modifier.CodeValue}>
              {modifier.CodeMeaning}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const name = (
    <div style={{ marginBottom: 10 }}>
      <label>Name</label>
      <input
        name="name"
        className="form-themed form-control input-overload"
        onChange={onChangeLabel}
        type="text"
        autoComplete="off"
        defaultValue={state.name}
        placeholder="Measurement name.."
        tabIndex="1"
        style={{
          borderColor: state.validLabel ? 'unset' : 'var(--snackbar-error)',
        }}
      />
    </div>
  );

  const description = (
    <div style={{ marginBottom: 10 }}>
      <label>Description</label>
      <input
        name="description"
        className="form-themed form-control input-overload"
        onChange={onChangeDescription}
        type="text"
        autoComplete="off"
        defaultValue={state.description}
        placeholder="Measurement Description.."
        tabIndex="1"
        style={{
          borderColor: state.validDescription ? 'unset' : 'var(--snackbar-error)',
        }}
      />
    </div>
  );

  return (
    <React.Fragment>
      <div>
        {name}
        {description}
        {categorySelect}
        {typeSelect}
        {modifierSelect}
        <div style={{ marginBottom: 20 }} />
      </div>
      <div className="footer" style={{ justifyContent: 'flex-end' }}>
        <div>
          <button
            onClick={onClose}
            data-cy="cancel-btn"
            className="btn btn-default"
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            data-cy="ok-btn"
            onClick={() => {
              onUpdateProperty({
                name: state.name,
                description: state.description,
                categoryUID: state.categoryUID,
                typeUID: state.typeUID,
                modifierUID: state.modifierUID,
              });
              onClose();
            }}
            disabled={!state.validLabel}
          >
            Save
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

MeasurementPropertyModal.propTypes = {
  metadata: PropTypes.object,
  onUpdateProperty: PropTypes.func,
  onClose: PropTypes.func,
};

MeasurementPropertyModal.defaultProps = {
  metadata: undefined,
  onUpdateProperty: undefined,
  onClose: undefined,
};

export default MeasurementPropertyModal;
