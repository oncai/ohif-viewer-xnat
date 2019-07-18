import React from "react";
import * as divs from "./HelpMenuROIDivs.js";

export default class HelpMenuROI extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      menus: [
        {
          name: "Draw",
          xlinkHref:
            "packages/ohif_viewerbase/assets/icons.svg#icon-freehand-draw"
        },
        {
          name: "Sculpt",
          xlinkHref:
            "packages/ohif_viewerbase/assets/icons.svg#icon-freehand-sculpt"
        },
        {
          name: "Contours",
          xlinkHref:
            "packages/icr_peppermint-tools/assets/icons.svg#icon-freehand-switch-volume"
        }
      ],
      selected: "Draw"
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
      case "Draw":
        return divs.draw;
      case "Sculpt":
        return divs.sculpt;
      case "Contours":
        return divs.contours;
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
