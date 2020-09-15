# OHIF-Viewer-XNAT

Upgraded to XNAT OHIF Viewer v4.2.7 ([@ohif/viewer@4.2.7](https://github.com/OHIF/Viewers/releases/tag/%40ohif%2Fviewer%404.2.7))

***The OHIF-XNAT viewer is based on a fork of [OHIF Viewer 2.0](https://github.com/OHIF/Viewers)) and uses the [React](https://reactjs.org/) JavaScript library.***
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
