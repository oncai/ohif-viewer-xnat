import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { setWindowing } from '../state';

const { WwwcTool } = cornerstoneTools;

/**
 * @public
 * @class CustomWwwcTool
 * @memberof Tools
 *
 * @classdesc Custom tool for setting wwwc by dragging with mouse/touch.
 * @extends Tools.Base.BaseTool
 */
export default class CustomWwwcTool extends WwwcTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'CustomWwwc',
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  mouseDragCallback(evt) {
    super.mouseDragCallback(evt);
    const enabledElement = cornerstone.getEnabledElement(evt.detail.element);
    setWindowing(enabledElement.uuid, 'Manual');
  }

  touchDragCallback(evt) {
    super.touchDragCallback(evt);
    const enabledElement = cornerstone.getEnabledElement(evt.detail.element);
    setWindowing(enabledElement.uuid, 'Manual');
  }
}
