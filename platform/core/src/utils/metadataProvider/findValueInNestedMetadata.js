const findValueInNestedMetadata = (object, key) => {
  let value;
  Object.keys(object).some(k => {
    const childObject = object[k];
    if (k === key) {
      value = childObject;
      return true;
    }
    if (childObject && typeof childObject === 'object') {
      value = findValueInNestedMetadata(childObject, key);
      return value !== undefined;
    }
  });
  return value;
};

const findValueWithPathInNestedMetadata = (object, key, path = '') => {
  let valuePath;
  Object.keys(object).some(k => {
    const childObject = object[k];
    if (k === key) {
      valuePath = { value: childObject, path: `${path}-${k}` };
      return true;
    }
    if (childObject && typeof childObject === 'object') {
      valuePath = findValueWithPathInNestedMetadata(childObject, key, `${path}-${k}`);
      return valuePath !== undefined;
    }
  });
  return valuePath;
};

export default findValueInNestedMetadata;
