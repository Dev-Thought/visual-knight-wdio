import fs from 'fs-extra';
import request from 'request-promise-native';
import BaseCompare from 'wdio-visual-regression-service/lib/methods/BaseCompare';
import debug from 'debug';
import _ from 'lodash';

const log = debug('visual-knight-wdio:Compare');

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
        this.projectId = _.get(options, 'projectId', '');
        this.additionalData = _.get(options, 'additionalData', {});
    }

    async afterScreenshot(context, screenshot) {
        // console.log('=======================================');
        // console.log(this.getTestName(context));
        // console.log('Image created initialize visual testing');
        // console.log('=======================================');
        console.time('VisualizingTime');

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
        // console.log('Requesting signed url');
        // console.time('signedUrlTime');
        await request.post(this.api + '/screenshot-v3', options, function (error, response, body) {
            if (error) {
                console.log('Error!', error);
            } else {
                presigendUrl = body.url;
                testSessionId = body.testSessionId;
            }
        });
        // console.timeEnd('signedUrlTime');

        // upload screenshot
        // console.log('Upload image');
        // console.time('uploadImage');
        await request.put(presigendUrl, {
            body: decodedFile,
            headers: {
                'Content-Type': 'image/png'
            }
        });
        // console.timeEnd('uploadImage');

        // console.log('Waiting for result');
        // console.time('resultTime');
        let testData = await request.get(`${this.api}/testsession-state?testSessionId=${testSessionId}`, {
            headers
        });
        testData = JSON.parse(testData);
        const testMisMatchPercentage = testData.misMatchPercentage !== '' ? parseFloat(testData.misMatchPercentage) : null;
        const testIsSameDimensions = testData.isSameDimensions;

        // console.timeEnd('resultTime');
        console.timeEnd('VisualizingTime');

        // Recieve result

        console.log(this.getTestName(context));
        console.log(testData);
        console.log(testMisMatchPercentage, testIsSameDimensions);
        if (testData && testMisMatchPercentage !== null) {
            if (testMisMatchPercentage > this.misMatchTolerance) {
                log(`Image is different! ${testMisMatchPercentage * 100}%`);
                console.log(`Image is different! ${testMisMatchPercentage * 100}%`);

                return this.createResultReport(testMisMatchPercentage, false, testIsSameDimensions);
            } else {
                log(`Image is within tolerance or the same`);
                console.log(`Image is within tolerance or the same`);

                return this.createResultReport(testMisMatchPercentage, true, testIsSameDimensions);
            }

        } else {
            log('No baseline defined');
            console.log('No baseline defined');
            return this.createResultReport(0, false, true);
        }
    }
}


