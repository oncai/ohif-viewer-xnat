const XNAT_EVENTS = {
  // Contour ROI
  CONTOUR_ADDED: 'xnatcontouradded',
  CONTOUR_MODIFIED: 'xnatcontourmodified',
  CONTOUR_COMPLETED: 'xnatcontourcompleted',
  CONTOUR_REMOVED: 'xnatcontourremoved',
  CONTOUR_INTERPOLATED: 'xnatcontourinterpolateevent',
  PEPPERMINT_INTERPOLATE_EVENT: 'peppermintinterpolateevent',
  // Measurement Annotation
  MEASUREMENT_ADDED: 'xnatmeasurementadded',
  MEASUREMENT_MODIFIED: 'xnatmeasurementmodified',
  MEASUREMENT_COMPLETED: 'xnatmeasurementcompleted',
  MEASUREMENT_REMOVED: 'xnatmeasurementremoved',
};

export default XNAT_EVENTS;
