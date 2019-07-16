import React from "react";

const draw = (
  <div>
    <p>The ROI Draw tool is used to create and edit contours of an ROI.</p>
    <h5>Draw Polygons</h5>
    <ul>
      <li>Click to draw a node.</li>
      <li>Keep clicking to draw the contour point by point.</li>
      <li>
        Complete the contour by clicking on the origin node without crossing any
        lines.
      </li>
    </ul>
    <h5>Draw Freehand</h5>
    <ul>
      <li>Hold the mouse to start drawing.</li>
      <li>Drag the mouse to draw the contour.</li>
      <li>
        Complete the contour by releasing the mouse at the origin node without
        crossing any lines.
      </li>
    </ul>
    <h5>Edit</h5>
    <ul>
      <li>Ctrl-click on a handle to delete it.</li>
      <li>Ctrl-click on a line to insert a new handle.</li>
      <li>Drag a handle to move it.</li>
    </ul>
    <h5>Shortcuts</h5>
    <ul>
      <li>Clicking ‘N’ will create a new volume and activate it.</li>
      <li>
        Alt-click (cmd-click on mac) a contour node to select it as the active
        ROI for drawing.
      </li>
      <li>Double-click a contour node to change the name of an ROI.</li>
      <li>
        Clicking 'delete' whilst drawing will cancel the contour you are
        drawing.
      </li>
      <li> Clicking escape whilst drawing will quickly close the contour.</li>
    </ul>
  </div>
);

const sculpt = (
  <div>
    <p>This tool is used to sculpt contours drawn with the freehand tool.</p>
    <h5>Select ROI</h5>
    <ul>
      <li>Double click near a contour to select it for editing.</li>
      <li>
        A cursor touching the edge of the contour will appear to show its
        selected.
      </li>
    </ul>
    <h5>Edit ROI</h5>
    <ul>
      <li>Hold down left click near the selected tool to begin editing.</li>
      <ul>
        <li>
          The closer to the contour the mouse is, the smaller the tool will be.
        </li>
        <li>The tool can push from both inside and outside the contour.</li>
      </ul>
      <li>With the mouse held down, drag the tool to push the ROI.</li>
      <ul>
        <li>New points will be created and deleted as needed.</li>
      </ul>
      <li>Release the mouse to complete the edit.</li>
      <li>
        You may find you wish to make rough edits with a large tool, before
        making fine adjustments with a finer tool.
      </li>
    </ul>
  </div>
);

const contours = (
  <div>
    <p>
      A "Region of Interest" Contour (ROI Contour) is defined as a collection of
      2D contours that make up a continuous volume. The Contours side panel
      displays a list of ROI Contours displayed on the scan in the active
      viewport, as well as some global settings for ROI Contour tools.
    </p>

    <h5>Contour List</h5>
    <ul>
      <li>Click on the "+ ROI Contour" button to add a new ROI Contour.</li>
      <li>
        Click on a button in the Draw column to select which color to draw.
      </li>
      <li>Click on a ROI Contour's name to edit it.</li>
    </ul>

    <h5>Import</h5>
    <p>
      You may import as many ROI Collections as you wish, you don't need to be
      viewing the correct scan in order to import it. Imported ROI Collections
      come in locked (viewable but not editable). You can unlock these by
      clicking on the unlock symbol, each ROI Contour will then be moved to the
      New ROI Contour Collection, allowing you to edit the ROI Contours and
      resave them as a different collection.
    </p>

    <h5>Export</h5>
    <p>
      You may choose which ROI Contours to export together as a collection. You
      must give the collection a human readable name. If there is only one
      ROIContour in the list, the collection name will default to the ROIContour
      name.
    </p>

    <h5>Interpolation</h5>
    <p>
      Toggles contour interpolation. When turned on, drawing new 2D contours
      will produce intermediate contours estimated by linear interpolation.
    </p>
    <ul>
      <li>Interpolated contours are denoted by a dotted line.</li>
      <li>
        Interpolated contours are recalculated everytime a source contour (solid
        line) is edited.
      </li>
      <li>If you edit an interpolated contour, it becomes a source contour.</li>
      <li>
        Interpolation won't occur if there are multiple contours of the same ROI
        on a frame, due to ambiguity.
      </li>
    </ul>
    <h5>Stats</h5>
    <p>Toggles the display of ROI Contour statistics on the screen.</p>
    <p>Enabled</p>
    <ul>
      <li>The statistics for each ROI will be displayed on the screen.</li>
      <li>Statistic windows can be moved by dragging them with the mouse.</li>
      <li>Statistic windows will be present in exported snapshots.</li>
    </ul>
    <p>Disabled</p>
    <ul>
      <li>The statistics can be viewed by hovering over an ROI's node.</li>
      <li>
        If a stats window has been moved, the stats window will display at that
        location.
      </li>
    </ul>
  </div>
);

export { draw, sculpt, contours };
