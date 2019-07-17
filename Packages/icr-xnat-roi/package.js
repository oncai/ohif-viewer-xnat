Package.describe({
  name: "icr:xnat-roi",
  summary: "Region of interest import/export and volume functionality.",
  version: "0.1.0"
});

Package.onUse(function(api) {
  api.versionsFrom("1.4");

  api.use(["ecmascript", "standard-app-packages", "http", "jquery", "stylus"]);

  // OHIF dependencies
  api.use([
    "ohif:design",
    "ohif:cornerstone",
    "ohif:core",
    "ohif:hotkeys",
    "ohif:log",
    "icr:xnat-roi-namespace",
    "icr:peppermint-tools",
    "icr:series-info-provider",
    "clinical:router"
  ]);

  // ===== Assets =====
  api.addAssets("assets/icons.svg", "client");

  // ===== Interface =====
  api.addFiles("client/viewportFunctions.js", "client");
  api.addFiles("client/test.js", "client");

  // ===== Components =====
  api.addFiles("client/components/viewer/ioDialogs/ioDialogs.html", "client");
  api.addFiles("client/components/viewer/ioDialogs/ioDialogs.js", "client");
  api.addFiles("client/components/viewer/ioDialogs/ioDialogs.styl", "client");

  // Help Menu
  api.addFiles(
    "client/components/viewer/helpDialogs/helpDialogs.html",
    "client"
  );
  api.addFiles("client/components/viewer/helpDialogs/helpDialogs.js", "client");
  api.addFiles(
    "client/components/viewer/helpDialogs/helpDialogs.styl",
    "client"
  );

  // Database
  api.addFiles("client/lib/IO/indexedDB.js", "client");

  api.addFiles("client/lib/sessionRefresh.js", "client");

  api.mainModule("main.js", "client");
});
