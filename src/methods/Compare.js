import fs from 'fs-extra';
import request from 'request-promise-native';
import BaseCompare from 'wdio-visual-regression-service/lib/methods/BaseCompare';
import debug from 'debug';
import _ from 'lodash';

const log = debug('visual-knight-wdio:RemoteCompare');

export default class RemoteCompare extends BaseCompare {
  constructor(options = {}) {
    super();
    log(options);
    this.getTestName = options.testName;
    this.getDeviceName = options.deviceName;
    this.getBrowserName = options.browserName;
    this.misMatchTolerance = _.get(options, 'misMatchTolerance', 0.01);
    this.api = _.get(options, 'api', '');
    this.key = _.get(options, 'key', '');
    this.liveResult = _.get(options, 'liveResult', true);
    this.projectId = _.get(options, 'projectId', '');
    this.additionalData = _.get(options, 'additionalData', {});
  }

  async afterScreenshot(context, screenshot) {
    log('=======================================');
    log(this.getTestName(context));
    log('Image created initialize visual testing');
    log('=======================================');

    const decodedFile = new Buffer(screenshot, 'base64');
    if (!this.getBrowserName) {
      throw new Error('You must specify the browser name');
    }
    if (!this.getDeviceName) {
      throw new Error('You must specify the device name');
    }
    const headers = {
      'content-type': 'application/json', // Is set automatically
      'x-api-key': this.key
    };

    var options = {
      method: 'POST',
      uri: this.api,
      body: {
        test: this.getTestName(context),
        projectId: this.projectId,
        misMatchTolerance: this.misMatchTolerance,
        additional: this.additionalData,
        browserName: this.getBrowserName(context),
        deviceName: this.getDeviceName(context)
      },
      headers,
      json: true // Automatically stringifies the body to JSON
    };

    // get presigned url to upload screenshot
    let presigendUrl = '';
    let testSessionId = '';
    log('Requesting signed url');
    await request.post(this.api + '/screenshot-v3', options, function(error, response, body) {
      if (error) {
        console.log('Error!', error);
      } else {
        presigendUrl = body.url;
        testSessionId = body.testSessionId;
      }
    });

    // upload screenshot
    log('Upload image');
    await request.put(presigendUrl, {
      body: decodedFile,
      headers: {
        'Content-Type': 'image/png'
      }
    });
    if (this.liveResult) {
      log('Waiting for visualization result');
      let testData = await request.get(`${this.api}/testsession-state?testSessionId=${testSessionId}`, {
        headers
      });
      testData = JSON.parse(testData);
      const testMisMatchPercentage =
        testData.misMatchPercentage !== '' ? parseFloat(testData.misMatchPercentage) : null;
      const testIsSameDimensions = testData.isSameDimensions;

      if (testData && testMisMatchPercentage !== null) {
        if (testMisMatchPercentage > this.misMatchTolerance) {
          log(`Image is different! ${testMisMatchPercentage * 100}%`);

          return this.createResultReport(testMisMatchPercentage, false, testIsSameDimensions, false);
        } else {
          log(`Image is within tolerance or the same`);

          return this.createResultReport(testMisMatchPercentage, true, testIsSameDimensions, false);
        }
      } else {
        log('No baseline defined');
        return this.createResultReport(0, false, true, true);
      }
    } else {
      return 'No live result activated';
    }
  }

  createResultReport(misMatchPercentage, isWithinMisMatchTolerance, isSameDimensions, hasNoBaseline) {
    return {
      misMatchPercentage,
      isWithinMisMatchTolerance,
      isSameDimensions,
      isExactSameImage: !hasNoBaseline && misMatchPercentage === 0,
      hasNoBaseline
    };
  }
}
