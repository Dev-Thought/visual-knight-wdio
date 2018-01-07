var assert = require('assert');
describe('test a page', function() {
  it('should make a picture from google.de', function() {
    browser.url('https://www.google.de/?hl=de');
    assertScreenshot(browser.checkViewport());
  });
});

/**
 * @param {array} screenshotResults Contains an array of all screenshot results and configured viewports
 */
function assertScreenshot(screenshotResults) {
  const screenshotResult = screenshotResults[0];
  if (typeof screenshotResult === 'object') {
    assert.ok(!screenshotResult.hasNoBaseline, `Has no baseline defined`);
    assert.ok(
      screenshotResult.isWithinMisMatchTolerance,
      `Mismatch tolerance to high: ${screenshotResult.misMatchPercentage} %`
    );
  }
}
