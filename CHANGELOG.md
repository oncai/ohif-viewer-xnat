**3.5.3**

- Fixed rendering overlay data over thumbnail images.

**3.5.2**

- Ensure ROICollections return a non-null, non-empty string to use as a filename. Fixes issue 44.

**3.5.1**

- Select ROI labels using a list populated from presets stored on XNAT at project-level.
- Display overlays in the scan thumbnail view for scans with overlay data.
- Deactivated the export of ROI Collections in cases of unsupported modalities or insufficient permission.
- Added scrollbar to the scan browser.
- Fixed a bug in obtaining XNAT user details for guest access.

**3.5.0**

- ROI contour rendering in the 3D MPR mode.
- Volume calculation and display for contour and mask ROIs.
- Calculate and display the 2D statistics of mask ROIs.
- Refactored the ROI Collections export for shared projects configuration.
- Populate DICOM Equipment module values from the reference scan for storing ROI Collections.
- Display scan modality in the scan browser.
- Upgraded underlying JavaScript packages and tools.
- Fixed measurement import/export issue for multiframe images. 
- Fixed issues caused when using Node.js v16.14.0.
- Restrict NM image fusion only for image type 'RECON TOMO'.

**3.5.0 ALPHA-1**

- Populate instance-level fields that were dropped from the optimised JSON metadata.

**3.4.1**

- Fixed import and export issues of measurement data for DICOM multiframe images.
- Set values of the DICOM General Equipment tags based on the viewer attributes: manufacturer, model-name and software-versions.

**3.4.0**

- Enabled NVIDIA AIAA tools. Switch between AIAA or MONAILabel tools based on the backend configuration.
- Fixed label value to label name mapping in the MONAILabel client.

**3.4.0 RC-2**

- New settings option to load a scan from the middle rather than from the top slice.
- Added a progress indicator to monitor the loading progress of images. Currently, does not support multiframe images or images that were removed from cache.
- Show a dialog upon creating measurements to set name and description.
- Added support to set and restore presentation state parameters from measurements.
- Fixed issues caused when switching between the 3D MPR and the standard viewer modes.

**3.4.0 RC-1**

- New feature: Measurement Service to manage and interact with measurement annotations.
  - Measurement panel: groups measurements into working and imported collections.
  - Export and import measurement collections to and from the XNAT platform.
  - Individual measurement interaction buttons: edit metadata, toggle visibility, jump to slice, and remove.
  - Measurement API to interface with measurements from other Viewer extensions.
- New feature: Client for MONAI Label server to facilitate interactive medical image annotation.
  - Interactively segment parts of an image using clicks (DeepGrow & DeepEdit models).
  - Fully automated annotation without user interaction (Segmentation models).
- Minor improvements and bug fixes.

**3.3.0**

- New feature: lazy loading of contour ROIs. The feature can be activated in preferences.
- New feature: concurrent loading of contour ROIs (optionally enabled in preferences). 
- New feature: store and retrieve a project template for contour ROI colors.
- New feature: switch between contour ROI color schemes - project template, from metadata, and custom values. 
- Supported drawing/import/export of mask ROIs for the Ultrasound Image Storage 1.2.840.10008.5.1.4.1.1.6.1.
- Added UI controls to sort the contour ROI list by name. Applies only to the locked collections.
- Used automatically generated notation to identify scans with duplicate series number.
- Fixed contour ROI import/export for multiframe images.
- Fixed segmentation and mask tools for touch-based interaction.
- Fixed the rendering position of the contour sculpt tool.
- Switched to SVGR loader to enable custom title for icons.
- Removed unnecessary ITK modules to reduce the bundle size.
- Other minor improvements and bug fixes.

**3.2.0**

- Set subject's ID/name as title in the browser tab.
- Use rescaled colormap for image fusion in the 3D MPR mode.
- Cache the ROI collection lists used in the study browser to reduce repeated API calls.
- Fixed manifest and service worker issues when served from a subfolder.
- Quick ROI imports via clicking on relevant icons in the study browser.
- Fixed thumbnail re-rendering issue.
- Fixed intensity scaling for images with variable window/level.
- Display 4D image thumbnail based on the subset image index.
- Added windowing info to the viewport overlay.
- Refactored smooth and sync components for improved interaction.
- Handle missing modality scaling parameters in the 3D MPR mode.

**3.2.0 RC-1**

- Multi-volume image fusion in 3D MPR mode.
- Improved support for DICOM Nuclear Medicine (NM) IOD.
- Two new tools: reference lines and crosshairs.
- Added orientation marker in MPR mode.
- Improved mask import for co-planar and perpendicular segmentation data.
- Added keyboard shortcuts for mask undo/redo.
- Fixed duplicate StudyInstanceUID issue.
- Refactored the mask settings menu for improved interaction.
- Upgraded the image loader to use WebAssembly for data decoding.
- Upgraded dependencies to recent applicable versions. 

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
