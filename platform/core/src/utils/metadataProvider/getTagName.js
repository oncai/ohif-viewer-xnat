import dcmjs from 'dcmjs';

const { DicomMetaDictionary } = dcmjs.data;
const { dictionary, punctuateTag } = DicomMetaDictionary;

/**
 * getTagName Maps raw tag value from integer to attribute name
 * @param intRawTag
 * @returns {string|undefined}
 */
const getTagName = intRawTag => {
  const hexRawTag = intRawTag
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
  const punctuatedTag = punctuateTag(hexRawTag);
  const tag = dictionary[punctuatedTag];

  return tag && tag.name ? tag.name : undefined;
};

export default getTagName;
