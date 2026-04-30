const auth = require('../services/auth');

module.exports = (program) => {
  program.command('login').description('Authenticate with GitHub').action(auth.login);
  program.command('logout').description('Clear the local Insighta session').action(auth.logout);
  program.command('whoami').description('Show the current authenticated user').action(auth.whoami);
};
