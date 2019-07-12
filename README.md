# OHIF-Viewer-XNAT

The OHIF-XNAT viewer is currently based on a fork of [OHIF/Viewers 1.x](https://github.com/OHIF/Viewers/tree/v1.x). This version has a hard dependency on [`Meteor`](https://www.meteor.com/), which is an full stack JavaScript development framework. Going forwards, OHIF-XNAT needs to migrate to [OHIF Viewer 2.0](ohif-xnat-viewer-2x.md). This README describes developing/compiling the current version, and in the future will serve as a legacy maintainance guide.

####Disclaimer
All these instructions will assume you are using a Unix system, the commands/package managers will be different if you are using Windows, and you might have to perform a little Googling to translate the commands. You could also join the brave new world of users using [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10), and follow this guide to the letter on windows.

##Setup {#setup}

First you must install `Meteor` globally on your system if you have not already done so:

```bash
curl https://install.meteor.com/ | sh
```

Clone the `OHIF-Viewer-XNAT` repo and checkout to the current `dev` branch:

```bash
git clone https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat
cd OHIF-Viewer-XNAT
git fetch origin
git checkout origin/dev
git checkout -b myDevBranch
```

`OHIF-Viewer-XNAT` uses the `Standalone Viewer` app from `OHIF/Viewers 1.x`.
Navigate to it and install its dependencies:

```bash
cd StandaloneViewer/StandaloneViewer/
meteor npm install
```

Your packages should now be installed and you are ready for development!

## Local Development {#local-development}

To run a development server, from `/StandaloneViewer/StandaloneViewer` folder you are currently in:

```bash
METEOR_PACKAGE_DIRS="../../Packages" meteor
```

The `METEOR_PACKAGE_DIRS` environment variable just sets the route to the `Packages` folder in the repo, where most of the implementation code is written.

To test locally you need the tag of a test dataset. For now we can use a tag that exists by default, e.g. `CTStudy`. Navigate to your browser and your development viewer will be available here:

`http://localhost:3000/CTStudy`

If you make a change to any file within the OHIF-Viewer-XNAT root directory or subdirectories, the build process will hot-build your change, refresh your browser and you can test you changes immediately.

If you want to build UI that makes calls to the XNAT REST API, its currently easiest to just mock the responses here and build everything in Dev mode (see e.g. `Packages/icr-xnat-roi/client/components/viewer/xnatNavigation/testJSON`).

The development experience for PWAs that communicate with an XNAT backend should improve in the future with the development of the [xnat-scaffold](https://bitbucket.org/rherrick/xnat-scaffold/src/WIP/), which is an [`Electron`](https://electronjs.org/) app with XNAT authentication and CORS issues dealt for you, allowing you to easily hook up your PWA to any number of live/development XNAT instances.

### Test Datasets and Custom Datasets

The list of test data sets can be found here: `StandaloneViewer/StandaloneViewer/server/collections.js`, which reference JSON files in `StandaloneViewer/StandaloneViewer/private/testData`, which each link to a webserver that hosts the images. You can create your own test datasets, but you must make sure the server hosting the images are fully [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) enabled, or your browser will not be able to fetch the images for security reasons.

If you want to host it at a different port you can specify a different `ROOT_URL`, e.g. to host at `3666`:

```bash
METEOR_PACKAGE_DIRS="../../Packages" ROOT_URL=http://localhost:3666 meteor
```

## Building for Production {#building-for-production}

To build this app for production we need to do two things:

1. Build a client only build of the viewer (minified js, HTML, css and static assets.)
2. Wrap this build in an XNAT plugin.

### Building the OHIF client

If you've been following along closely so far, you might have noticed that we need a client only build of the viewer... which is built in `Meteor`, a full-stack framework. This is the most painful part of the process and why OHIF 2.0 is built in `React`.

Introducing `meteor-build-client-fixed2`. `meteor-build-client` was a build tool created by Github user [frozeman](https://github.com/frozeman/meteor-build-client) that removes all the server components of a meteor application and produced a standalone client-only build of a `Meteor` project. Frozeman quickly got interested in Ethereum development and the project was not maintained. After a lot of drama about passing ownership of the repo to other users etc, the repo was eventually forked... twice. We ended up with a _semi-maintained_ build tool, working at the time of writing: `meteor-build-client-fixed2`. Install it using `npm`:

```bash
npm install meteor-build-client-fixed2 -g
```

Now cross your fingers and enter this beast of a command in the `StandaloneViewer/StandaloneViewer` directory (you might want to wrap it in its own bash function if you are going to do this frequently):

```bash
METEOR_PACKAGE_DIRS="../../Packages" meteor-build-client-fixed2 ../myOutputFolder -u VIEWER -s ../settings.json -p "" --legacy
```

where:

- `myOutputFolder` is the directory you want the build to appear in.
- `-u VIEWER` specifies the extension the viewer is on in XNAT. Leave this as is.
- `-s ../settings.json` specifies a settings file with some configuration options. The file included in the repo just makes sure the left sidebar is open by default.
- `--legacy` sets IE11 as a target. Its kind of flakey though, and in my experience static asssets such as SVGs aren't linked properly. The solution for better support is... to move to OHIF 2.0 ¯\\\_(ツ)\_/¯.

The resulting build will be present in `StandaloneViewer/myOutputFolder`, which we'll use in the next step.

### Building the XNAT plugin.

Clone the `ohif-XNAT-viewer-plugin` repo and switch to the `dev` branch (TODO: Move this to the ICR-informatics bitbucket)

```bash
git clone https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat-plugin
cd ohif-viewer-XNAT-plugin
git fetch origin
git checkout origin/dev
git checkout -b dev
```

Most of this plugin is boilerplate, it adds the API for the viewer to talk to XNAT data, and JSON manifest generation for the viewer to be able to do its streaming `Web Access to DICOM Objects` (WADO) magic.

Nuke the contents of `src/main/resources/META-INF/resources/VIEWER/`, and copy the contents of your OHIF viewer build directory there (`myOutputFolder` in the previous section).

Great, now your viewer build is wrapped in an XNAT plugin, you are ready to build it. At the root of `ohif-viewer-XNAT-plugin`:

```bash
./gradlew clean fatjar
```

And if all is successful your resulting XNAT plugin jar will be located in `build/libs`.

## Depolyment {#deployment}

Move your built jar to the plugin folder of your XNAT. `ohif-viewer-XNAT-plugin` depends on the [xnat-roi-plugin](https://bitbucket.org/icrimaginginformatics/xnat-roi-plugin). At the time of writing the pre-releases aren't following semantic versioning, hwoever this will change in the near future. Currently, a compatible version of the plugin is sitting in the `ohif-viewer-XNAT-plugin` repo under `dist/`. Copy over this plugin to your XNAT plugin directory also. Restart Tomcat (or your xnat-web) container if using [`xnat-docker-compose`](https://github.com/NrgXnat/xnat-docker-compose).

You can check the plugins are correctly integrated by checking they show up in the `Adminster/Site Administration/Installed Plugins` menu of the XNAT interface.
