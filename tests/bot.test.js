const assert = require('assert');
const commands = require('../src/commands');

(async() => {
    const menuCommand = commands.menu;
    assert.ok(menuCommand, 'menu command should exist');
    const helpCommand = commands.help;
    assert.ok(helpCommand, 'help command should exist');
    const aiCommand = commands.ai;
    assert.ok(aiCommand, 'ai command should exist');
    const utilityCommand = commands.weather;
    assert.ok(utilityCommand, 'weather command should exist');
    console.log('Basic command registry test passed');
})();