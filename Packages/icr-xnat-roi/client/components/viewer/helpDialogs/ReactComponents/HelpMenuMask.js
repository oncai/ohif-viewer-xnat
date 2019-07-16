import React from "react";
import * as divs from "./HelpMenuMaskDivs.js";

export default class HelpMenuMask extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      menus: [
        {
          name: "Manual",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-brush-regular"
        },
        {
          name: "Smart CT",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-brush-smart"
        },
        {
          name: "Auto",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-brush-auto"
        },
        {
          name: "Segments",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-seg-management-menu"
        }
      ],
      selected: "Manual"
    };

    this.isSelected = this.isSelected.bind(this);
    this.onButtonClick = this.onButtonClick.bind(this);
    this.insertHelpSection = this.insertHelpSection.bind(this);
  }

  isSelected(name) {
    return this.state.selected === name ? "pressed" : "depressed";
  }

  onButtonClick(name) {
    this.setState({ selected: name });
  }

  insertHelpSection() {
    const { selected } = this.state;

    switch (selected) {
      case "Manual":
        return divs.manual;
      case "Smart CT":
        return divs.smartCt;
      case "Auto":
        return divs.auto;
      case "Segments":
        return divs.segments;
    }
  }

  render() {
    const { menus, selected } = this.state;

    return (
      <>
        <div>
          <div className="sub-help-nav-bar">
            {menus.map(menu => (
              <a
                className="sub-help-button btn btn-sm btn-primary"
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

          <div className="sub-help-title">
            <h3>{selected}</h3>
          </div>
        </div>

        <div className="sub-help-body">{this.insertHelpSection()}</div>
      </>
    );
  }
}
