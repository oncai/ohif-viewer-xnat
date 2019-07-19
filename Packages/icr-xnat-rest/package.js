Package.describe({
  name: "icr:xnat-rest",
  summary: "Rest calls to XNAT.",
  version: "0.1.0"
});

Package.onUse(function(api) {
  api.versionsFrom("1.4");
  api.use(["ecmascript", "standard-app-packages", "http", "jquery", "stylus"]);
  api.mainModule("main.js", "client");
});
