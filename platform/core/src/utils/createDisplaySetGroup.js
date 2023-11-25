const createDisplaySetGroup = displaySets => {
  const displaySetInfoList = displaySets.map((ds, dsIndex) => ({
    uid: ds.uid,
    label: `Instance ${dsIndex + 1}`,
  }));

  // A maximum of 9 viewports, sett all to display the first instance
  const viewportActiveDisplaySetInfo = Array(9).fill(displaySetInfoList[0]);

  const getViewportDisplaySetInfo = viewportIndex => {
    if (viewportIndex !== undefined) {
      return viewportActiveDisplaySetInfo[viewportIndex];
    }
  };

  const hasActiveDisplaySet = activeDisplaySetInstanceUID => {
    const stackInfo = displaySetInfoList.find(
      info => info.uid === activeDisplaySetInstanceUID
    );
    return stackInfo !== undefined;
  };

  const getDisplaySet = options => {
    const { viewportIndex, displaySetInstanceUID } = options;
    let uid = displaySetInstanceUID;
    if (viewportIndex !== undefined) {
      const displaySetInfo = viewportActiveDisplaySetInfo[viewportIndex];
      uid = displaySetInfo.uid;
    }
    if (uid) {
      return displaySets.find(ds => ds.displaySetInstanceUID === uid);
    }
  };

  const updateViewportDisplaySet = options => {
    const { viewportIndex, displaySetInstanceUID } = options;
    if (viewportIndex !== undefined && displaySetInstanceUID) {
      const displaySetInfo = displaySetInfoList.find(
        info => info.uid === displaySetInstanceUID
      );
      if (displaySetInfo) {
        viewportActiveDisplaySetInfo[viewportIndex] = displaySetInfo;
      }
    }
  };

  const subDisplaySetGroupData = {
    displaySets,
    displaySetInfoList,
    getViewportDisplaySetInfo,
    getDisplaySet,
    updateViewportDisplaySet,
    hasActiveDisplaySet,
  };

  displaySets.forEach(ds => {
    ds.isThumbnailViewEnabled = false;
    ds.hasMultiDisplaySets = true;
    ds.subDisplaySetGroupData = subDisplaySetGroupData;
  });

  displaySets[0].isThumbnailViewEnabled = true;

  return displaySets[0];
};

export default createDisplaySetGroup;

/*
// ToDo: consider using a proxy configuration
  const createDisplaySetGroup = displaySets => {
    // Parent controller
    const ref = {
      hasMultiDisplaySets: true,
      subDisplaySets: displaySets,
      activeDisplaySetIndex: 0,
    };

    const proxyHandler = {
      get: (target, prop, receiver) => {
        if (prop in ref) {
          return ref[prop];
        }
        return displaySets[ref.activeDisplaySetIndex][prop];
      },
      set: (target, prop, value) => {
        if (prop in ref) {
          ref[prop] = value;
          return true;
        }
        Reflect.set(displaySets[ref.activeDisplaySetIndex], prop, value);
        return true;
      },
    };

    const displaySetGroup = new Proxy({}, proxyHandler);

    return displaySetGroup;
  };
*/
