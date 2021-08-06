**3.1.0 RC**

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
