**3.1.0**

- Fixed buffer size for reading NIfTI segmentation data.

**3.1.0 RC-3**

- Replaced frame number with instance number in the tag browser.
- Added DICOM File Meta Information to the Tag Browser.
- Fixed overlays not displaying issue.

**3.1.0 RC-2**

- Refactored the Tag Browser extension: bug fixes and showing all elements (for loaded images).
- Refactored a new class to read and align NIfTI segmentation data. Added support for cornerstonejs/nifti-image-loader.
- Handle errors when loading images and show notification with error message.
- Notify about ROI export export issues.
- Added a progress indicator for importing contour collections.
- Fixed a bug that prevented changing Window/Level preferences.
- Fixed slice order in image sets to match imageIndex with instanceNumber.  

**3.1.0 RC-1**

- Upgraded to v4.9.20 of the mainstream OHIF Viewer ([@ohif/viewer@4.9.20](https://github.com/OHIF/Viewers/releases/tag/%40ohif%2Fviewer%404.9.20)).
- Filter ROI collection import list based session label and scan number.
- DICOM tag browser added.
- Visual notifications added to warn about inconsistencies in scan data, e.g. frames have different dimensions.
- Highlight active scan in the Scan Browser panel, and show the number of available ROIs per scan.
- Added new segmentation tools: correction scissors and brush eraser.
- Toolbar buttons added to undo/redo manual segmentation.
- Support changing segmentation brush size when using touch screen devices.
- Smart & Auto segmentation brush: custom gate-separation value + retain the settings between viewer sessions.
- Show the number of slices for each segment and jump to the middle slice when value clicked.
- Toggle visibility of contour collections.
- Added support for 3D deepgrow in the NVIDIA AIAA Client (requires Clara v4.0+).
- Fixed the annotations ‘delete all’ function to remove currently displayed measurements.
- Fixed segmentation export issue when having multiple viewports.
- Fixed Ultrasound measurements to show values in physical units. Fix does not support SequenceOfUltrasoundRegions with a multiple entries.
- Fixed `imageId` issue that prevented scrolling through some multi-frame images.
