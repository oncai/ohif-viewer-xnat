import WebWorkerPromise from 'webworker-promise';
import { utils } from '@ohif/core';
import meshBuilderCallbacks from '../meshBuilderCallbacks';
// eslint-disable-next-line import/no-webpack-loader-syntax
import MeshBuilderWorker from './ContourRoiMeshBuilder.worker';

const { makeCancelable } = utils;

class MeshBuilderWorkerPool {
  constructor() {
    this.maxNumWorkers = 4;
    this.numWorkers = 0;
    this.jobs = [];
    //
    this.cancelablePromises = {};
  }

  queueJob(params) {
    this.jobs.push(params);
    if (this.numWorkers < this.maxNumWorkers) {
      this.nextJob();
    }
  }

  nextJob() {
    if (this.jobs.length) {
      const job = this.jobs.shift();
      const { params } = job;
      const { uid, pointData } = params;
      const worker = new MeshBuilderWorker();
      const workerPromise = new WebWorkerPromise(worker);

      const promise = makeCancelable(
        workerPromise.postMessage(
          {
            uid,
            pointData,
          },
          [pointData.buffer],
          async (eventName, message) => {
            meshBuilderCallbacks.onProgressUpdate(
              message.uid,
              message.progress
            );
          }
        )
      );
      this.cancelablePromises[uid] = { promise, worker };
      this.numWorkers++;
      promise
        .then(result => {
          meshBuilderCallbacks.onSuccess(uid, result);
        })
        .catch(error => {
          const errorMessage =
            error.message || 'Could not reconstruct this ROI in 3D';
          meshBuilderCallbacks.onError(uid, errorMessage);
        })
        .finally(res => {
          worker.terminate();
          delete this.cancelablePromises[uid];
          this.numWorkers--;
          this.nextJob();
        });
    }
  }

  cancelAllJobs() {
    Object.keys(this.cancelablePromises).forEach(uid => {
      const jobPromise = this.cancelablePromises[uid];
      if (jobPromise) {
        jobPromise.promise.cancel();
        jobPromise.worker.terminate();
        delete this.cancelablePromises[uid];
      }
    });
    this.numWorkers = 0;
    this.jobs = [];
  }
}

const meshBuilderWorkerPool = new MeshBuilderWorkerPool();

// ToDo: Remove this!
window.meshBuilderWorkerPool = meshBuilderWorkerPool;

export default meshBuilderWorkerPool;
