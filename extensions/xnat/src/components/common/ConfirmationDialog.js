import React from 'react';
import PropTypes from 'prop-types';
import { UserPreferences } from '@ohif/viewer/src/components/UserPreferences';

const customStyle = {
  width: 400,
};

const DialogContents = props => {
  return (
    <React.Fragment>
      <div>
        <h3>{props.message}</h3>
      </div>
      <div className="footer">
        <div>
          <button
            onClick={props.modal.hide}
            data-cy="cancel-btn"
            className="btn btn-default"
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            data-cy="ok-btn"
            // onClick={props.onAccept(props.modal, props.args)}
            onClick={() => {
              console.log('yes button pressed..');
              props.onAccept();
              props.modal.hide();
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

// DialogContents.propTypes = {
//   UIModalService: PropTypes.any,
//   message: PropTypes.string,
// };

const ConfirmationDialog = ({
  modal,
  title,
  message,
  onAccept,
}) => {
  modal.show({
    content: DialogContents,
    contentProps: {
      message: message,
      modal: modal,
      onAccept: onAccept,
    },
    title: title,
    // customClassName: customStyle,
  });
};

export default ConfirmationDialog;

/*
ConfirmationDialog({
      modal: this.props.UIModalService,
      title: 'Confirmation',
      message: 'Do you want to unlock this contour collection?',
      args: '12345',
    });
 */

/*
    //confirmation dialog
    const onAccept = () => {
      this.setState({
        unlockConfirmationOpen: true,
        roiCollectionToUnlock: structureSetUid,
      });
    };

    ConfirmationDialog({
      modal: this.props.UIModalService,
      title: 'Confirmation',
      message: 'Do you want to unlock this contour collection?',
      onAccept: onAccept,
    });*/
