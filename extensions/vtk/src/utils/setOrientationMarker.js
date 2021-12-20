import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

const ORIENTATION_MARKER_TYPE = {
  HUMAN: 'human',
  CUBE: 'cube',
};

const _humanActor = vtkActor.newInstance();

const setOrientationMarker = (
  api,
  markerType = ORIENTATION_MARKER_TYPE.CUBE
) => {
  let setMarker;
  switch (markerType) {
    case ORIENTATION_MARKER_TYPE.HUMAN:
      setMarker = humanOrientationMarker;
      break;
    case ORIENTATION_MARKER_TYPE.CUBE:
      setMarker = cubeOrientationMarker;
      break;
    default:
      setMarker = cubeOrientationMarker;
  }

  setMarker(api);
};

const humanOrientationMarker = api => {
  const renderWindow = api.genericRenderWindow.getRenderWindow();
  // const renderer = api.genericRenderWindow.getRenderer();

  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: _humanActor,
    interactor: renderWindow.getInteractor(),
  });

  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  );
  // BOTTOM_RIGHT = [1 - xFrac, 0, 1, yFrac]
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(100);
  orientationWidget.setMaxPixelSize(300);

  // renderer.resetCamera();
  renderWindow.render();

  api.orientationWidget = orientationWidget;
};

const cubeOrientationMarker = api => {
  const renderer = api.genericRenderWindow.getRenderer();
  const renderWindow = api.genericRenderWindow.getRenderWindow();

  //+X, -X, +Y, -Y, +Z, -Z =>  A, P, L, R, S, I

  // create axes
  const axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    text: 'L',
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: res => res / 2,
    faceColor: '#0000ff',
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });
  axes.setXMinusFaceProperty({
    text: 'R',
    faceColor: '#ffff00',
    faceRotation: -90,
    fontStyle: 'italic',
  });
  axes.setYPlusFaceProperty({
    text: 'P',
    faceColor: '#00ff00',
    faceRotation: 180,
    // fontSizeScale: res => res / 4,
  });
  axes.setYMinusFaceProperty({
    text: 'A',
    faceColor: '#00ffff',
    fontColor: 'white',
  });
  axes.setZPlusFaceProperty({
    text: 'S',
    // edgeColor: 'yellow',
  });
  axes.setZMinusFaceProperty({
    text: 'I',
    // faceRotation: 45,
    edgeThickness: 0,
  });

  // create orientation widget
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: renderWindow.getInteractor(),
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  );
  // BOTTOM_RIGHT = [1 - xFrac, 0, 1, yFrac]
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(100);
  orientationWidget.setMaxPixelSize(300);

  // orientationWidget.updateMarkerOrientation();
  api.orientationWidget = orientationWidget;

  // renderer.resetCamera();
  renderWindow.render();
};

const readHumanMarker = async () => {
  let success = false;
  const modelUrl = `${process.env.PUBLIC_URL}assets/markers/human.vtp`;
  try {
    const content = await DataAccessHelper.get('http').fetchBinary(modelUrl);
    const humanPolyReader = vtkXMLPolyDataReader.newInstance();
    if (!humanPolyReader.parseAsArrayBuffer(content)) {
      throw new Error();
    }

    const mapper = vtkMapper.newInstance();
    mapper.setScalarModeToUsePointFieldData();
    mapper.setColorByArrayName('Color');
    mapper.setColorModeToDirectScalars();

    _humanActor.setMapper(mapper);

    mapper.setInputConnection(humanPolyReader.getOutputPort());

    _humanActor.setUserMatrix(
      vtkMatrixBuilder
        .buildFromDegree()
        .rotateZ(180)
        .getMatrix()
    );

    success = true;
  } catch (e) {
    console.error(
      'Error reading the human orientation marker - switching to cube marker'
    );
  }

  return success;
};

export default setOrientationMarker;
export { readHumanMarker, ORIENTATION_MARKER_TYPE };
