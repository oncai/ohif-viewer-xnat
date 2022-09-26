import { getToolState } from 'cornerstone-tools';
import preventPropagation from './preventPropagation';

export default function preMouseDownCallback(evt) {
  let consumeEvent = false;
  const { element, currentPoints } = evt.detail;
  const coords = currentPoints.canvas;

  const toolState = getToolState(element, this.name);

  if (!toolState) {
    return false;
  }

  for (let d = 0; d < toolState.data.length; d++) {
    const data = toolState.data[d];
    const nearTool = this.pointNearTool(element, data, coords);
    if (nearTool) {
      if (!data.visible || data.locked) {
        consumeEvent = true;
        break;
      }
    }
  }

  if (consumeEvent) {
    preventPropagation(evt);
  }

  return consumeEvent;
}
