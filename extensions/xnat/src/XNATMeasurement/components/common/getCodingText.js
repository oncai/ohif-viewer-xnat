const getCodingText = coding => {
  const { category, type, modifier } = coding;
  let typeWithModifier = type;

  if (modifier) {
    typeWithModifier += ` (${modifier})`;
  }

  return `${typeWithModifier} - ${category}`;
};

export default getCodingText;
