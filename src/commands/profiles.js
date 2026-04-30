const fs = require('fs');
const path = require('path');
const api = require('../services/api');
const Table = require('cli-table3');
const ora = require('ora');

function cleanOptions(opts) {
  const params = {};
  const map = {
    gender: 'gender',
    country: 'country_id',
    ageGroup: 'age_group',
    minAge: 'min_age',
    maxAge: 'max_age',
    sortBy: 'sort_by',
    order: 'order',
    page: 'page',
    limit: 'limit'
  };
  for (const [key, apiKey] of Object.entries(map)) {
    if (opts[key] !== undefined) params[apiKey] = opts[key];
  }
  return params;
}

function printProfiles(rows) {
  const table = new Table({ head: ['ID', 'Name', 'Gender', 'Age', 'Age Group', 'Country'] });
  rows.forEach((p) => table.push([
    p.id,
    p.name,
    p.gender || '',
    p.age || '',
    p.age_group || '',
    p.country_id || p.country_name || ''
  ]));
  console.log(table.toString());
}

module.exports = (program) => {
  const profiles = program.command('profiles').description('Work with profiles');

  profiles.command('list')
    .option('--gender <gender>')
    .option('--country <country>')
    .option('--age-group <ageGroup>')
    .option('--min-age <minAge>')
    .option('--max-age <maxAge>')
    .option('--sort-by <sortBy>')
    .option('--order <order>')
    .option('--page <page>')
    .option('--limit <limit>')
    .action(async (opts) => {
      const spinner = ora('Fetching profiles...').start();
      try {
        const res = await api.get('/profiles', { params: cleanOptions(opts) });
        spinner.stop();
        printProfiles(res.data.data || []);
        console.log(`Page ${res.data.page}/${res.data.total_pages} - ${res.data.total} total`);
      } catch (err) {
        spinner.fail(err.message);
      }
    });

  profiles.command('get <id>').action(async (id) => {
    const spinner = ora('Fetching profile...').start();
    try {
      const res = await api.get(`/profiles/${id}`);
      spinner.stop();
      printProfiles([res.data.data]);
    } catch (err) {
      spinner.fail(err.message);
    }
  });

  profiles.command('search <query>').action(async (query) => {
    const spinner = ora('Searching profiles...').start();
    try {
      const res = await api.get('/profiles/search', { params: { q: query } });
      spinner.stop();
      printProfiles(res.data.data || []);
      console.log(`Page ${res.data.page}/${res.data.total_pages} - ${res.data.total} total`);
    } catch (err) {
      spinner.fail(err.message);
    }
  });

  profiles.command('create')
    .requiredOption('--name <name>')
    .action(async (opts) => {
      const spinner = ora('Creating profile...').start();
      try {
        const res = await api.post('/profiles', { name: opts.name });
        spinner.stop();
        printProfiles([res.data.data || res.data]);
      } catch (err) {
        spinner.fail(err.message);
      }
    });

  profiles.command('export')
    .option('--format <format>', 'Export format', 'csv')
    .option('--gender <gender>')
    .option('--country <country>')
    .option('--age-group <ageGroup>')
    .option('--min-age <minAge>')
    .option('--max-age <maxAge>')
    .option('--sort-by <sortBy>')
    .option('--order <order>')
    .action(async (opts) => {
      const spinner = ora('Exporting profiles...').start();
      try {
        const res = await api.get('/profiles/export', {
          params: { ...cleanOptions(opts), format: opts.format },
          responseType: 'text'
        });
        const match = /filename="?([^";]+)"?/i.exec(res.headers['content-disposition'] || '');
        const filename = match ? match[1] : `profiles_${Date.now()}.csv`;
        const file = path.join(process.cwd(), filename);
        fs.writeFileSync(file, res.data);
        spinner.succeed(`Saved ${file}`);
      } catch (err) {
        spinner.fail(err.message);
      }
    });
};
