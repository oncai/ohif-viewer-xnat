# OHIF-Viewer-XNAT

***The OHIF-XNAT viewer is based on a fork of [OHIF Viewer 2.0](https://github.com/OHIF/Viewers)) and uses the [React](https://reactjs.org/) JavaScript library.***
Upgraded based on OHIF Viewer v4.9.20 ([@ohif/viewer@4.9.20](https://github.com/OHIF/Viewers/releases/tag/%40ohif%2Fviewer%404.9.20))

This repository is included as a submodule on the dev branch of the [OHIF Viewer XNAT Plugin](https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat-plugin/src/dev/) repository.

### Development environment
For testing purposes, and to avoid building and deployment of the XNAT plugin,
the viewer can run directly from within the development environment.

* Create /platform/viewer/.env file and fill it with the XNAT platform parameters,
similar to the example below
```
XNAT_DOMAIN=http://10.1.1.17
XNAT_USERNAME=admin
XNAT_PASSWORD=admin
```
* Start local development server <br>
```
yarn run dev:xnat
```

***--------------------***

# Original OHIF Viewer README:
Please refer to [OHIF Viewer 2.0](https://github.com/OHIF/Viewers)
