export {
  checkAndSetPermissions
} from "./client/lib/IO/checkAndSetPermissions.js";

import { default as XNATNavigation } from "./client/components/viewer/xnatNavigation/XNATNavigation.js";
import { default as MaskImportList } from "./client/components/viewer/maskImportListDialogs/MaskImportListDialog.js";
import { default as MaskExportList } from "./client/components/viewer/maskExportListDialogs/MaskExportListDialog.js";
import { default as RoiImportList } from "./client/components/viewer/roiImportListDialogs/RoiImportListDialog.js";
import { default as RoiExportList } from "./client/components/viewer/roiExportListDialogs/RoiExportListDialog.js";

const components = {
  XNATNavigation,
  MaskImportList,
  MaskExportList,
  RoiImportList,
  RoiExportList
};

export { components };
