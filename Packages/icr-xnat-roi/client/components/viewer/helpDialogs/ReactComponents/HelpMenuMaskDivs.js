import React from "react";

const brushInstructions = (
  <>
    <h5>Painting with the brush</h5>
    <ul>
      <li>Click on the canvas to paint with the selected color.</li>
      <li>Drag to make brush strokes.</li>
      <li>Use the + and - keys to increase/decrease the brush size.</li>
      <li>Use the [ and ] keys to change the mask color.</li>
      <li>Ctrl + click with the brush to erase that mask color.</li>
      <li>
        Use the N key to quickly switch to the first unused segmentation color.
      </li>
    </ul>
  </>
);

const brushSettingsInstructions = (
  <p>
    Holes/artifacts are filled and stray pixels removed, based on the settings
    configured in the Segments side panel.
  </p>
);

const manual = (
  <div>
    <p>
      The Manual Brush tool allows you to segment images with a circular brush.
    </p>
    {brushInstructions}
  </div>
);

const smartCt = (
  <div>
    <p>
      The smart CT brush tool allows you to segment specific tissue types of CT
      images based on a pair of Hounsfield Units (HU). The tissue type can be
      chosen in the Brush Settings menu, as well as a custom HU gate.
    </p>
    {brushSettingsInstructions}
    {brushInstructions}
  </div>
);

const auto = (
  <div>
    <p>
      The Auto Brush tool finds the minimum and maximum pixel values within the
      brush radius when pressing down the mouse. Dragging after pressing down
      the mouse will only fill in pixels within this band.
    </p>
    {brushSettingsInstructions}
    {brushInstructions}
  </div>
);

const smartSettings = (
  <>
    <h5>Smart CT Gate Selection</h5>
    <p>
      This option allows you to select the tissue type the Smart CT brush uses.
      You can also specify a custom gate in Hounsfield Units.
    </p>
    <h5>Smart/Auto Gate Settings</h5>
    <p>These settings affect both the Smart CT and Auto Brush tools.</p>
    <ul>
      <li>
        The first slider sets the size of holes to fill in whilst painting, as a
        fraction of the primary region painted within the brush circle.
      </li>
      <li>
        The second slider sets the size of non-primary regions to ignore whilst
        painting, as a fraction of the primary region painted within the brush
        circle. Regions smaller than this threshold will not be painted.
      </li>
    </ul>
  </>
);

const segments = (
  <div>
    <p>
      A segment is defined as a 3D mask of a particular color, defining one
      region of interest. The Segments side panel displays a list of segments
      displayed on the scan in the active viewport, as well as some global
      settings for brush tools.
    </p>

    <h5>Segment List</h5>
    <ul>
      <li>Click on the "+ Segment" button to add a new segment.</li>
      <li>
        Click on a button in the Paint column to select which color to paint.
      </li>
      <li>Click on a segment's label or type to edit its metadata.</li>
      <li>Click hide to hide a segment.</li>
      <li>
        Click delete to delete a segment from your working collection. You will
        be asked to confirm your choice, as this can't be done.
      </li>
    </ul>

    <h5>Import</h5>
    <p>
      You may overlay one labelmap on a scan at a time. This limitation is due
      to memory limitations within the browser, and will be improved in the
      future. You may edit the labelmap and re-save it as a new ROI Collection.
    </p>

    <h5>Export</h5>
    <p>
      You can export the labelmap. Overlapping segments are valid and can be
      exported.
    </p>
    {smartSettings}
  </div>
);

export { manual, smartCt, auto, segments };
