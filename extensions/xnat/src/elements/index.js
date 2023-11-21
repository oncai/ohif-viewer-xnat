// ICR/XNAT icons
import xnatOhifLogo from './icons/xnat-ohif-logo.svg';
import xnatOhifLogoAnim from './icons/xnat-ohif-logo-animated.svg';
import xnatIcrLogo from './icons/xnat-icr-logo.svg';
import xnatSettings from './icons/xnat-settings.svg';
import xnatAnnotations from './icons/xnat-annotations.svg';
import xnatContour from './icons/xnat-contour.svg';
import xnatMask from './icons/xnat-mask.svg';
import xnatContourFreehand from './icons/xnat-contour-freehand-draw.svg';
import xnatContourFreehandSculpt from './icons/xnat-contour-freehand-sculpt.svg';
import xnatMaskManual from './icons/xnat-mask-manual.svg';
import xnatMaskSmartCt from './icons/xnat-mask-smart-ct.svg';
import xnatMaskAuto from './icons/xnat-mask-auto.svg';
import xnatTreeMinus from './icons/xnat-tree-minus.svg';
import xnatTreePlus from './icons/xnat-tree-plus.svg';
import xnatTreeShow from './icons/xnat-tree-show.svg';
import xnatCancel from './icons/xnat-cancel.svg';
import xnatImport from './icons/xnat-import.svg';
import xnatExport from './icons/xnat-export.svg';
import xnatHelp from './icons/xnat-help.svg';
import xnatBrushEraser from './icons/xnat-mask-brush-eraser.svg';
import xnatUndo from './icons/xnat-undo.svg';
import xnatRedo from './icons/xnat-redo.svg';
import xnatImageComposition from './icons/xnat-image-composition.svg';
import xnatColormap from './icons/xnat-colormap.svg';
import xnatOpacity from './icons/xnat-opacity.svg';
import xnatContrastRange from './icons/xnat-contrast-range.svg';
import xnatRefresh from './icons/xnat-refresh.svg';
import xnatLoadRoi from './icons/xnat-load-roi.svg';
import xnatDialogHandle from './icons/xnat-dialog-handle.svg';
import xnatCircle from './icons/xnat-circle.svg';
import xnatCircleEraseInside from './icons/xnat-circle-erase-inside.svg';
import xnatCircleFillOutside from './icons/xnat-circle-fill-outside.svg';
import xnatCircleEraseOutside from './icons/xnat-circle-erase-outside.svg';
import xnatContourHandle from './icons/xnat-contour-handle.svg';
import xnatDeleteContour from './icons/xnat-delete-contour.svg';
import xnatPincel from './icons/xnat-pencil.svg';
import xnatMeasureLength from './icons/xnat-measure-length.svg';
import xnatMeasureArrow from './icons/xnat-measure-arrow.svg';
import xnatMeasureAngle from './icons/xnat-measure-angle.svg';
import xnatMeasureBidirectional from './icons/xnat-measure-bidirectional.svg';
import xnatMeasureCircle from './icons/xnat-measure-circle.svg';
import xnatMeasureRectangle from './icons/xnat-measure-rectangle.svg';
import xnatSmooth from './icons/xnat-smooth.svg';
import xnatSync from './icons/xnat-sync.svg';
import xnatAnnotate from './icons/xnat-annotate.svg';
import xnatViewportOverlay from './icons/xnat-viewport-overlay.svg';
import xnatStack from './icons/xnat-stack.svg';

import Loader from './Loader/Loader';

import { sliderUtils, ReactSlider } from './rangeSliders';

import SortIcon from './SortIcon/SortIcon';

import ROIContourColorPicker from './colorPickers/ROIContourColorPicker';

import FormattedValue from './FormattedValue/FormattedValue';

import CheckIcon from './CheckIcon/CheckIcon';

const XNATICONS = {
  'xnat-ohif-logo': xnatOhifLogo,
  'xnat-ohif-logo-anim': xnatOhifLogoAnim,
  'xnat-icr-logo': xnatIcrLogo,
  'xnat-settings': xnatSettings,
  'xnat-annotations': xnatAnnotations,
  'xnat-contour': xnatContour,
  'xnat-mask': xnatMask,
  'xnat-contour-freehand': xnatContourFreehand,
  'xnat-contour-freehand-sculpt': xnatContourFreehandSculpt,
  'xnat-mask-manual': xnatMaskManual,
  'xnat-mask-smart-ct': xnatMaskSmartCt,
  'xnat-mask-auto': xnatMaskAuto,
  'xnat-tree-plus': xnatTreePlus,
  'xnat-tree-minus': xnatTreeMinus,
  'xnat-tree-show': xnatTreeShow,
  'xnat-cancel': xnatCancel,
  'xnat-import': xnatImport,
  'xnat-export': xnatExport,
  'xnat-help': xnatHelp,
  'xnat-brush-eraser': xnatBrushEraser,
  'xnat-undo': xnatUndo,
  'xnat-redo': xnatRedo,
  'xnat-image-composition': xnatImageComposition,
  'xnat-colormap': xnatColormap,
  'xnat-opacity': xnatOpacity,
  'xnat-contrast-range': xnatContrastRange,
  'xnat-refresh': xnatRefresh,
  'xnat-load-roi': xnatLoadRoi,
  'xnat-dialog-handle': xnatDialogHandle,
  'xnat-circle': xnatCircle,
  'xnat-circle-erase-inside': xnatCircleEraseInside,
  'xnat-circle-fill-outside': xnatCircleFillOutside,
  'xnat-circle-erase-outside': xnatCircleEraseOutside,
  'xnat-contour-handle': xnatContourHandle,
  'xnat-delete-contour': xnatDeleteContour,
  'xnat-pencil': xnatPincel,
  'xnat-measure-length': xnatMeasureLength,
  'xnat-measure-arrow': xnatMeasureArrow,
  'xnat-measure-angle': xnatMeasureAngle,
  'xnat-measure-bidirectional': xnatMeasureBidirectional,
  'xnat-measure-circle': xnatMeasureCircle,
  'xnat-measure-rectangle': xnatMeasureRectangle,
  'xnat-smooth': xnatSmooth,
  'xnat-sync': xnatSync,
  'xnat-annotate': xnatAnnotate,
  'xnat-viewport-overlay': xnatViewportOverlay,
  'xnat-stack': xnatStack,
};

export {
  XNATICONS,
  Loader,
  sliderUtils,
  ReactSlider,
  SortIcon,
  ROIContourColorPicker,
  FormattedValue,
  CheckIcon,
};
