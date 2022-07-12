import { GeneralAnatomyList } from '../../peppermint-tools';

const categories = GeneralAnatomyList.SegmentationCodes.Category;

const getAnatomyCoding = uids => {
  const { categoryUID, typeUID, modifierUID } = uids;

  let RecommendedDisplayCIELabValue = [255, 0, 0];

  const category = categories.find(
    categoriesI => categoriesI.CodeValue === categoryUID
  );
  const type = category.Type.find(typesI => typesI.CodeValue === typeUID);

  const CategoryCodeSequence = {
    CodeValue: category.CodeValue,
    CodingSchemeDesignator: category.CodingSchemeDesignator,
    CodeMeaning: category.CodeMeaning,
  };

  const TypeCodeSequence = {
    CodeValue: type.CodeValue,
    CodingSchemeDesignator: type.CodingSchemeDesignator,
    CodeMeaning: type.CodeMeaning,
  };

  if (modifierUID) {
    const modfier = type.Modifier.find(
      modifierI => modifierI.CodeValue === modifierUID
    );

    TypeCodeSequence.TypeModifierCodeSequence = {
      CodeValue: modfier.CodeValue,
      CodingSchemeDesignator: modfier.CodingSchemeDesignator,
      CodeMeaning: modfier.CodeMeaning,
    };
    RecommendedDisplayCIELabValue = modfier.recommendedDisplayRGBValue;
  } else {
    RecommendedDisplayCIELabValue = type.recommendedDisplayRGBValue;
  }

  return {
    CategoryCodeSequence,
    TypeCodeSequence,
    RecommendedDisplayCIELabValue,
  };
};

export default getAnatomyCoding;
