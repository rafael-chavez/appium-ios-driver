import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import js2xml from "js2xmlparser2";
import log from '../logger';
import { fs } from 'appium-support';
import { exec } from 'teen_process';


let commands = {}, helpers = {}, extensions = {};

commands.active = async function () {
  if (this.isWebContext()) {
    return await this.executeAtom('active_element', []);
  } else {
    return await this.uiAutoClient.sendCommand("au.getActiveElement()");
  }
};

commands.getDeviceTime = async function () {
  log.info('Attempting to capture iOS device date and time');
  if (this.isRealDevice()) {
    try {
      let idevicedate = await fs.which('idevicedate');
      log.info(`Found idevicedate: '${idevicedate}'`);
      let {stdout} = await exec('idevicedate', ['-u', this.opts.udid]);
      return stdout.trim();
    } catch (err) {
      log.errorAndThrow('Could not capture device date and time using libimobiledevice idevicedate. ' +
                     'Libimobiledevice is probably not installed');
    }
  } else {
    log.warn('getDeviceTime command works only for real devices');
    throw new errors.NotYetImplementedError();
  }
};

commands.hideKeyboard = async function (strategy, ...possibleKeys) {
  possibleKeys.pop(); // last parameter is the session id
  let cmd;
  let key = _.find(possibleKeys ,(k) => {return k;});
  if (key) {
    strategy = strategy || 'pressKey';
    cmd = `au.hideKeyboard('${strategy}', '${key}')`;
  } else {
    strategy = strategy || 'default';
    cmd = `au.hideKeyboard('${strategy}')`;
  }
  await this.uiAutoClient.sendCommand(cmd);
};

commands.getPageSource = async function () {
  if (this.isWebContext()) {
    let cmd = 'document.getElementsByTagName("html")[0].outerHTML';
    return await this.remote.execute(cmd);
  } else {
    let jsonSource = await this.getSourceForElementForXML();
    if (typeof jsonSource === "string") {
      jsonSource = JSON.parse(jsonSource);
    }
    let xmlSource = js2xml("AppiumAUT", jsonSource, {
      wrapArray: {enabled: false, elementName: "element"},
      declaration: {include: true},
      prettyPrinting: {indentString: "    "}
    });
    return xmlSource;
  }
};

commands.background = async function (secs) {
  await this.uiAutoClient.sendCommand(`au.background(${secs})`);
};

commands.lock = async function (secs) {
  await this.uiAutoClient.sendCommand(`au.lock(${secs})`);
};

commands.closeApp = async function () {
  try {
    await this.stop();
    log.info(`Successfully closed the [${this.opts.app}] app.`);
  } catch (err) {
    log.warn(`Something went wrong whilst closing the [${this.opts.app}] app.`);
    throw err;
  }
};

commands.launchApp = async function () {
  try {
    await this.start();
    log.info(`Successfully launched the [${this.opts.app}] app.`);
  } catch(err) {
    log.warn(`Something went wrong whilst launching the [${this.opts.app}] app.`);
    throw err;
  }
};

commands.keys = async function (keys) {
  // TODO: should not be needed -> keys = util.escapeSpecialChars(keys, "'");
  if (this.isWebContext()) {
    let el = await this.active();
    if (_.isUndefined(el.ELEMENT)) {
      throw new errors.NoSuchElementError();
    }
    await this.setValue(keys, el.ELEMENT);
  } else {
    let command = `au.sendKeysToActiveElement('${keys}')`;
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.setGeoLocation = async function (location) {
  // TODO: check the hasOptions bit, the method signature should be location, option

  //let hasOptions = altitude !== null || horizontalAccuracy !== null || verticalAccuracy !== null || course !== null || speed !== null;
  //if (hasOptions) {
    //let options = {};
    //if (altitude !== null) {
      //options.altitude = altitude;
    //}
    //if (horizontalAccuracy !== null) {
      //options.horizontalAccuracy = horizontalAccuracy;
    //}
    //if (verticalAccuracy !== null) {
      //options.verticalAccuracy = verticalAccuracy;
    //}
    //if (course !== null) {
      //options.course = course;
    //}
    //if (speed !== null) {
      //options.speed = speed;
    //}
    //await this.uiAutoClient.sendCommand(
      //`target.setLocationWithOptions(${JSON.stringify(coordinates)}, ${JSON.stringify(options)})`);
  //} else {
    await this.uiAutoClient.sendCommand(
      `target.setLocation(${JSON.stringify(location)})`);
  //}
};

commands.getWindowSize = async function (windowHandle="current") {
  if (windowHandle !== "current") {
    throw new errors.NotYetImplementedError("Currently only getting current window size is supported.");
  }

  if (this.isWebContext()) {
    return await this.executeAtom('get_window_size', []);
  } else {
    return await this.uiAutoClient.sendCommand("au.getWindowSize()");
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
