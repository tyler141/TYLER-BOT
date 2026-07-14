const menu = require('./menu');
const ai = require('./ai');
const downloader = require('./downloader');
const group = require('./group');
const owner = require('./owner');
const settings = require('./settings');
const fun = require('./fun');
const utility = require('./utility');

const commands = {
  ...menu,
  ...ai,
  ...downloader,
  ...group,
  ...owner,
  ...settings,
  ...fun,
  ...utility,
};

module.exports = commands;
