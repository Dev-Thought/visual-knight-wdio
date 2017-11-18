# Visual Knight - Webdriverio


## Installation

visual-knight-wdio uses [wdio-visual-regression-service](https://github.com/zinserjan/wdio-visual-regression-service) as base for capturing screenshots and uses visual knight as service.

You can install visual-knight-wdio via NPM as usual:

```sh
$ npm install visual-knight-wdio --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

## Configuration
Setup visual-knight-wdio by adding `visual-regression` to the service section of your WebdriverIO config and define the `VisualKnight.Compare` as comparison strategy.

```js
// wdio.conf.js

var path = require('path');
var VisualKnight = require('visual-knight-wdio')

function getTestName() {
  return function (context) {
    return context.test.title;
  }
}

function getBrowserName() {
  return function (context) {
    var browserVersion = parseInt(/\d+/.exec(context.browser.version)[0]);
    var browserName = context.browser.name;

    return `${browserName} - ${browserVersion}`;
  };
}

function getDeviceName() {
  return function (context) {
    return 'Windows 7';
  };
}

exports.config = {
  // ...
  services: [
    'visual-regression',
  ],
  visualRegression: {
    compare: new VisualKnight.Compare({
      api: `VISUAL_KNIGHT_API_ENDPOINT`,
      key: 'VISUAL_KNIGHT_USER_KEY',
      testName: getTestName(),
      browserName: getBrowserName(),
      deviceName: getDeviceName(),
      projectId: 'VISUAL_KNIGHT_PROJECT_ID',
      misMatchTolerance: 0.01,
    }),
    viewportChangePause: 300,
    viewports: [{ width: 320, height: 480 }, { width: 480, height: 320 }, { width: 1024, height: 768 }],
    orientations: ['landscape', 'portrait'],
  },
  // ...
};
```

### Options
Under the key `visualRegression` in your wdio.config.js you can pass a configuration object with the following structure:

* **compare** `Object` <br>
screenshot compare method

* **viewportChangePause**  `Number`  ( default: 100 ) <br>
wait x milliseconds after viewport change. It can take a while for the browser to re-paint. This could lead to rendering issues and produces inconsistent results between runs.

* **viewports** `Object[{ width: Number, height: Number }]`  ( default: *[current-viewport]* ) (**desktop only**)<br>
   all screenshots will be taken in different viewport dimensions (e.g. for responsive design tests)

* **orientations** `String[] {landscape, portrait}`  ( default: *[current-orientation]* ) (**mobile only**)<br>
    all screenshots will be taken in different screen orientations (e.g. for responsive design tests)


#### VisualKnight.Compare
It sends the screenshots for each test directly to the visual knight cloud and recieves a result of the diff.

You can pass the following options to it's constructor as object:

* **testName** `Function` <br>
pass in a function that returns the test name for the current screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

* **browserName** `Function` <br>
pass in a function that returns the browser name for the current screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

* **deviceName** `Function` <br>
pass in a function that returns the device name for the current screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

* **api** `String` <br>
api endpoint for the visual knight service. You can find it in your profile.

* **key** `String` <br>
user key for the visual knight service. You can find it in your profile.

* **projectId** `String` <br>
project id of your tests. The tests will be related to this project.

* **additionalData** `Object` <br>
you can provide additional data to your tests which are useful for filter in the visual knight application.

* **misMatchTolerance** `Number`  ( default: 0.01 ) <br>
number between 0 and 100 that defines the degree of mismatch to consider two images as identical, increasing this value will decrease test coverage.


## Usage
visual-knight-wdio uses wdio-visual-regression-service and enhances an WebdriverIO instance with the following commands:
* `browser.checkViewport([{options}]);`
* `browser.checkDocument([{options}]);`
* `browser.checkElement(elementSelector, [{options}]);`


All of these provide options that will help you to capture screenshots in different dimensions or to exclude unrelevant parts (e.g. content). The following options are
available:


* **exclude** `String[]|Object[]` (**not yet implemented**)<br>
  exclude frequently changing parts of your screenshot, you can either pass all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html)
  that queries one or multiple elements or you can define x and y values which stretch a rectangle or polygon

* **hide** `String[]`<br>
  hides all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `visibility: hidden`)

* **remove** `String[]`<br>
  removes all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `display: none`)

* **viewports** `Object[{ width: Number, height: Number }]` (**desktop only**)<br>
     Overrides the global *viewports* value for this command. All screenshots will be taken in different viewport dimensions (e.g. for responsive design tests)

* **orientations** `String[] {landscape, portrait}` (**mobile only**)<br>
    Overrides the global *orientations* value for this command. All screenshots will be taken in different screen orientations (e.g. for responsive design tests)

* **misMatchTolerance** `Number` <br>
    Overrides the global *misMatchTolerance* value for this command. Pass in a number between 0 and 100 that defines the degree of mismatch to consider two images as identical,

* **viewportChangePause**  `Number` <br>
    Overrides the global *viewportChangePause* value for this command. Wait x milliseconds after viewport change.

### License

MIT
