const iopTolerance = 0.01;

const isSameArray = (array1, array2) => {
  if (array1 === undefined || !array2 === undefined) {
    return;
  }

  return (
    array1.length === array2.length &&
    array1.every(
      (value, index) => Math.abs(value - array2[index]) < iopTolerance
    )
  );
};

export default isSameArray;
