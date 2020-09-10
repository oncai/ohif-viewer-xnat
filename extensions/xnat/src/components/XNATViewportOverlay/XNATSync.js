import React from 'react';
// import PropTypes from 'prop-types';

import './XNATViewportOverlay.styl';

class XNATSync extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isChecked: false,
    };
  }

  // static propTypes = {
  //   isChecked: PropTypes.bool.isRequired,
  // };

  render() {
    const { isChecked } = this.state;

    return (
      <div>
        Sync
        <input
          className="syncCheckbox"
          type="checkbox"
          name="smooth"
          value={isChecked}
        />
      </div>
    );
  }
}

export default XNATSync;
