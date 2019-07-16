import { cornerstoneTools } from "meteor/ohif:cornerstone";

Session.set("defaultStackSync", false);

// JamesAPetts

class StackSynchronizer {
  constructor() {
    this.Index = new cornerstoneTools.Synchronizer(
      "cornerstonenewimage",
      cornerstoneTools.stackImageIndexSynchronizer
    );
    this.Position = new cornerstoneTools.Synchronizer(
      "cornerstonenewimage",
      cornerstoneTools.stackImagePositionSynchronizer
    );
    this.synchronizationStrategy = "Position";
  }

  changeSynchronizationStrategy(newStrategy) {
    if (newStrategy !== "Index" && newStrategy !== "Position") {
      throw new Error(`Invalid stack synchronization strategy: ${newStrategy}`);
    }

    if (newStrategy === this.synchronizationStrategy) {
      console.log("Trying to change to same strategy, abort");
      return;
    }

    console.log(`changingSyncStrategy: ${newStrategy}`);

    let activeElements = this[this.synchronizationStrategy].getSourceElements();

    // Make a hardcopy of activeElements to avoid errors whilst adding or removing.
    let elements = [];

    for (let i = 0; i < activeElements.length; i++) {
      elements.push(activeElements[i]);
    }

    for (let i = 0; i < elements.length; i++) {
      this[this.synchronizationStrategy].remove(elements[i]);
    }

    for (let i = 0; i < elements.length; i++) {
      this[newStrategy].add(elements[i]);
    }

    this.synchronizationStrategy = newStrategy;
  }

  add(element) {
    this[this.synchronizationStrategy].add(element);
  }

  remove(element) {
    this[this.synchronizationStrategy].remove(element);
  }
}

const stackSynchronizer = new StackSynchronizer();

export { stackSynchronizer };
