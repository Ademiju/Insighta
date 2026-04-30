#!/usr/bin/env node
const { program } = require('commander');

program
  .name('insighta')
  .description('Insighta Labs+ command line client')
  .version('1.0.0');

require('../src/commands/auth')(program);
require('../src/commands/profiles')(program);

program.parse(process.argv);
