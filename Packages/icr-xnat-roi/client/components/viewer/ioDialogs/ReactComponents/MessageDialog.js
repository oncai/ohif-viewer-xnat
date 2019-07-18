import React from "react";

export default class MessageDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
  }

  /**
   * onCloseButtonClick - Closes the dialog.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    const dialog = document.getElementById("ioMessage");
    dialog.close();
  }

  render() {
    const { title, body } = this.props;

    return (
      <div>
        <div>
          <h5 className="io-description">{title}</h5>
          <a
            className="io-dialog-cancel btn btn-sm btn-secondary"
            onClick={this.onCloseButtonClick}
          >
            <i className="fa fa-times-circle fa-2x" />
          </a>
        </div>

        <div>
          <p className="io-body">{body}</p>
        </div>
      </div>
    );
  }
}
