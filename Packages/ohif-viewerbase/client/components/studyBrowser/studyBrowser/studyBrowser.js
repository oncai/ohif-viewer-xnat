import { Template } from "meteor/templating";
import { OHIF } from "meteor/ohif:core";

// JamesAPetts

Template.studyBrowser.onCreated(() => {
  const instance = Template.instance();

  instance.data.callRender = new ReactiveVar(Math.random());
});

Template.studyBrowser.helpers({
  studies: () => {
    // @TypeSafeStudies
    return OHIF.viewer.Studies.all();
  },
  showHideButton: study => {
    const instance = Template.instance();
    instance.data.callRender.get();

    if (study.selected) {
      return "fa fa-minus-square";
    }

    return "fa fa-plus-square";
  },
  isStudyVisable: study => {
    const instance = Template.instance();
    instance.data.callRender.get();

    if (study.selected) {
      return "isVisible";
    }

    return "isHidden";
  }
});

Template.studyBrowser.events({
  "click .js-show-hide"(event) {
    const studyInstanceUid = event.currentTarget.attributes.id.value;

    OHIF.viewer.Studies.all().forEach(study => {
      if (study.studyInstanceUid === studyInstanceUid) {
        study.selected = !study.selected;
      }
    });

    const instance = Template.instance();

    instance.data.callRender.set(Math.random());
  }
});
