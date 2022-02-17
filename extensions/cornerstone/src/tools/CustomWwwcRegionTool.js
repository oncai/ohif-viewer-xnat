import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { setWindowing } from '../state';

const { WwwcRegionTool } = cornerstoneTools;

/**
 * @public
 * @class CustomWwwcRegionTool
 * @memberof Tools
 *
 * @classdesc Tool for setting wwwc based on a rectangular region.
 * @extends Tools.Base.BaseTool
 */
export default class CustomWwwcRegionTool extends WwwcRegionTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'CustomWwwcRegion',
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  _applyStrategy(evt) {
    super._applyStrategy(evt);
    const enabledElement = cornerstone.getEnabledElement(evt.detail.element);
    setWindowing(enabledElement.uuid, 'Manual');
  }

  // touchEndCallback(evt) {
  //   super.touchEndCallback(evt);
  //   const enabledElement = cornerstone.getEnabledElement(evt.detail.element);
  //   setWindowing(enabledElement.uuid, 'Manual');
  // }
}
