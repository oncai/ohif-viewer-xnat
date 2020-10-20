import csTools from 'cornerstone-tools';

const { ProbeTool, getToolState } = csTools;
const triggerEvent = csTools.importInternal('util/triggerEvent');
const draw = csTools.importInternal('drawing/draw');
const drawHandles = csTools.importInternal('drawing/drawHandles');
const getNewContext = csTools.importInternal('drawing/getNewContext');

export default class AIAAProbeTool extends ProbeTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'AIAAProbeTool',
      supportedInteractionTypes: ['Mouse'],
      configuration: {
        drawHandles: true,
        handleRadius: 2,
        eventName: 'nvidiaaiaaprobeevent',
        color: ['red', 'blue'],
      },
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;

      return v.toString(16);
    });
  }

  createNewMeasurement(eventData) {
    // if (this.name === 'AIAAProbe') {
    //   console.info('AIAAProbe::createNewMeasurement');
    //   return;
    // }

    console.debug(eventData);
    let res = super.createNewMeasurement(eventData);
    if (res) {
      res.uuid = res.uuid || this.uuidv4();
      res.color = this.configuration.color[eventData.event.ctrlKey ? 1 : 0];
      res.ctrlKey = eventData.event.ctrlKey;
      res.imageId = eventData.image.imageId;
      res.x = eventData.currentPoints.image.x;
      res.y = eventData.currentPoints.image.y;

      console.info('TRIGGERING AIAA PROB EVENT: ' + this.configuration.eventName);
      console.info(res);
      triggerEvent(eventData.element, this.configuration.eventName, res);
    }
    return res;
  }

  renderToolData(evt) {
    // if (this.name === 'AIAAProbe') {
    //   console.info('AIAAProbe::renderToolData');
    //   return;
    // }

    const eventData = evt.detail;
    const { handleRadius } = this.configuration;

    const toolData = getToolState(evt.currentTarget, this.name);
    if (!toolData) {
      return;
    }

    const context = getNewContext(eventData.canvasContext.canvas);
    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];
      if (data.imageId !== eventData.image.imageId) {
        continue;
      }
      if (data.visible === false) {
        continue;
      }

      draw(context, context => {
        const color = data.color;
        drawHandles(context, eventData, data.handles, {
          handleRadius,
          color,
        });
      });
    }
  }
}