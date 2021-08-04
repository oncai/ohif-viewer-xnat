# OHIF-Viewer-XNAT

***The OHIF-XNAT viewer is based on a fork of [OHIF Viewer 2.0](https://github.com/OHIF/Viewers) and uses the [React](https://reactjs.org/) JavaScript library.***

This repository is included as a submodule in the [OHIF Viewer XNAT Plugin](https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat-plugin/src/) repository.

## 3.1.0-RC Release Notes:
The new release brings a variety of improvements to the Viewer. The underlying components have been upgraded to v4.9.20 of the mainstream OHIF Viewer.
For the full list of changes please refer to the [CHANGELOG](./CHANGELOG.md).

> :warning: **v3.1.0-RC is a pre-production release**:
>pre-production releases are intended for testing only and are not recommended for production use.



## Development environment
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

# Original OHIF Viewer README:
Please refer to [OHIF Viewer 2.0](https://github.com/OHIF/Viewers)
