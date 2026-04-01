#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { getICloudDrivePath, getConfigDir } from '../lib/icloud.js';
import { openDb } from '../lib/db.js';
import { initAnchor } from '../lib/init.js';
import { listEntries } from '../lib/list.js';
import { addFile } from '../lib/add.js';
import { recoverFile } from '../lib/recover.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

program
  .name('anchor')
  .description('Sync config files to iCloud Drive via symlinks')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize anchor: create iCloud config directory and database')
  .option('--dir <name>', 'config directory name in iCloud Drive', 'config')
  .action((options) => {
    try {
      const icloudBase = getICloudDrivePath();
      const result = initAnchor({ icloudBase, dirName: options.dir });
      console.log(chalk.green('Anchor initialized!'));
      console.log(`Config directory: ${result.configDir}`);
      if (result.discovered > 0) {
        console.log(`Discovered ${result.discovered} existing file(s).`);
      }
      if (result.entries.length > 0) {
        console.log(`\nTracked entries:`);
        for (const entry of result.entries) {
          const orig = entry.original_path ?? chalk.dim('(unknown)');
          console.log(`  ${entry.name} -> ${orig}`);
        }
      }
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all tracked config files')
  .option('--json', 'output as JSON')
  .action((options) => {
    try {
      const icloudBase = getICloudDrivePath();
      const configDir = getConfigDir(icloudBase);
      const db = openDb(configDir);
      const output = listEntries(db, { json: options.json });
      console.log(output);
      db.close();
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('add <source>')
  .description('Add a file or directory to iCloud and create a symlink')
  .option('--name <name>', 'custom name in iCloud directory')
  .option('--force', 'overwrite if already exists', false)
  .action((source, options) => {
    try {
      const icloudBase = getICloudDrivePath();
      const configDir = getConfigDir(icloudBase);
      const db = openDb(configDir);
      const result = addFile(db, {
        sourcePath: source,
        configDir,
        name: options.name,
        force: options.force,
      });
      console.log(chalk.green(`Added "${result.name}" to iCloud.`));
      console.log(`  ${result.originalPath} -> ${configDir}/${result.name}`);
      db.close();
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('recover <name>')
  .description('Recover a file from iCloud back to its original location')
  .option('--force', 'overwrite if file exists at original location', false)
  .action((name, options) => {
    try {
      const icloudBase = getICloudDrivePath();
      const configDir = getConfigDir(icloudBase);
      const db = openDb(configDir);
      const result = recoverFile(db, {
        name,
        configDir,
        force: options.force,
      });
      console.log(chalk.green(`Recovered "${result.name}".`));
      if (result.originalPath) {
        console.log(`  Restored to: ${result.originalPath}`);
      }
      db.close();
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
