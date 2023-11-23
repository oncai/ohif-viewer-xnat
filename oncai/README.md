# Onc.AI Fork of `ohif-viewer-xnat`

This repository exists only to serve as an intermediate source for
the `ohif-viewer-xnat` plugin.

Changes are based on:
* https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat-plugin.git = `v3.6.0`
* https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat.git = `v3.6.0`
* XNAT v1.8.7+ is required for the above plugin.

# Installation

> NOTE: Follow these steps carefully; you can break Tomcat.

In your XNATs `data` directory, there is a `plugins` directory where
all loadable plugins will live. The current OHIF viewer plugin should
live there.

> NOTE: Due to how XNAT installations vary per-installation, I can't
provide actual names and paths -- they may not match. It is up to you
to find the appropriate paths.

The steps for installing this library are as follows:

* Shutdown XNAT
* Remove the existing OHIF viewer `.jar` file from the plugins directory.
  * Or 'move' it to some other directory
* Start XNAT
* Confirm in the XNAT admin UI that the OHIF Viewer plugin is not installed
  * You shouldn't be able to view images on subjects.
* Shutdown XNAT
* Copy the Onc.AI version of the OHIF Viewer `.jar` file to the same
plugins directory where you removed the old `.jar`.
* Start XNAT again.
* Ensure that:
  * The OHIF Viewer plugin is installed
  * You can view subject imaging

At this point in time, the new XNAT OHIF Viewer image is installed.

> NOTE: If your browser has viewed a JPEG/2000 image with the old plugin
installed, you will need to invalidate/clear your browser image cache,
as the old image will be presented. This can also be confirmed using
a "private browsing" window.

## Motivation(s)

### Issue: Blurry JPEG/2000 DICOM images

https://onc-ai.atlassian.net/browse/DEV-2320

An issue exists in XNAT 1.8.9 where jpeg/2000 DICOM images appear
blurry.

The underlying fix is to upgrade the `cornerstone-wado-image-loader` library that exists in the plugins embedded `ohif-viewer-xnat` submodule
(effectively what this repository mirrors).

The plan is that a pull-request will be made upstream so that this
change will be included in an official release.
