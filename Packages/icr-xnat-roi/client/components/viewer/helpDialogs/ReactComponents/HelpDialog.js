import React from "react";
import HelpMenuROI from "./HelpMenuROI.js";
import HelpMenuMask from "./HelpMenuMask.js";

export default class HelpDialog extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      menus: [
        {
          name: "ROI",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-menu"
        },
        {
          name: "Mask",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-segmentation-menu"
        }
      ],
      selected: "ROI"
    };

    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
    this.insertSubMenu = this.insertSubMenu.bind(this);
  }

  onCloseButtonClick(evt) {
    const dialog = document.getElementById("showHelpDialog");
    dialog.close();
  }

  isSelected(name) {
    return this.state.selected === name ? "pressed" : "depressed";
  }

  onButtonClick(name) {
    this.setState({ selected: name });
  }

  insertSubMenu() {
    const { selected } = this.state;

    switch (selected) {
      case "ROI":
        return <HelpMenuROI />;
      case "Mask":
        return <HelpMenuMask />;
    }
  }

  render() {
    const { menus, selected } = this.state;

    return (
      <>
        <div>
          <div className="help-nav-bar">
            {menus.map(menu => (
              <a
                className="help-button btn btn-sm btn-primary"
                key={menu.name}
                onClick={() => {
                  this.onButtonClick(menu.name);
                }}
              >
                <svg className={this.isSelected(menu.name)}>
                  <use xlinkHref={menu.xlinkHref} />
                </svg>
              </a>
            ))}
          </div>

          <div className="help-title">
            <h3>{selected}</h3>
          </div>

          <a
            className="help-dialog-cancel btn btn-sm btn-secondary"
            onClick={this.onCloseButtonClick}
          >
            <i className="fa fa-times-circle fa-2x" />
          </a>
        </div>

        <br />
        {this.insertSubMenu()}
      </>
    );
  }
}
