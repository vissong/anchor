#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import readline from 'node:readline/promises';
import { getICloudDrivePath, getConfigDir } from '../lib/icloud.js';
import { openDb } from '../lib/db.js';
import { initAnchor } from '../lib/init.js';
import { listEntries } from '../lib/list.js';
import { addFile } from '../lib/add.js';
import { recoverFile } from '../lib/recover.js';
import { relinkFile } from '../lib/relink.js';
import { removeFile } from '../lib/remove.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

program
  .name('anchor')
  .description('Sync config files to iCloud Drive via symlinks')
  .version(pkg.version)
  .option('--dir <name>', 'config directory name in iCloud Drive', 'anchor');

program
  .command('init')
  .description('Initialize anchor: create iCloud config directory and database')
  .action(async () => {
    try {
      const icloudBase = getICloudDrivePath();
      let dirName = program.opts().dir;

      // If user didn't explicitly pass --dir, prompt interactively
      if (!process.argv.includes('--dir')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(
          `iCloud config directory name ${chalk.dim('(default: anchor)')}: `
        );
        rl.close();
        dirName = answer.trim() || 'anchor';
      }

      const result = initAnchor({ icloudBase, dirName });
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
      const configDir = getConfigDir(icloudBase, program.opts().dir);
      const db = openDb(configDir);
      const output = listEntries(db, { json: options.json, configDir });
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
  .action(async (source, options) => {
    try {
      const icloudBase = getICloudDrivePath();
      const configDir = getConfigDir(icloudBase, program.opts().dir);
      const db = openDb(configDir);
      const result = await addFile(db, {
        sourcePath: source,
        configDir,
        name: options.name,
        force: options.force,
        onConflict: async (destName) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const prefix = await rl.question(
            chalk.yellow(`"${destName}" already exists. `) +
            `Enter a prefix ${chalk.dim(`(e.g. abc -> abc_${destName})`)}: `
          );
          rl.close();
          return prefix.trim() || null;
        },
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
      const configDir = getConfigDir(icloudBase, program.opts().dir);
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

program
  .command('relink <name>')
  .description('Re-create symlink for an unlinked file in iCloud')
  .action((name) => {
    try {
      const icloudBase = getICloudDrivePath();
      const configDir = getConfigDir(icloudBase, program.opts().dir);
      const db = openDb(configDir);
      const result = relinkFile(db, { name, configDir });
      console.log(chalk.green(`Relinked "${result.name}".`));
      console.log(`  ${result.originalPath} -> ${result.icloudPath}`);
      db.close();
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('remove <name>')
  .description('Remove an entry from the database and delete the file from iCloud')
  .option('-y, --yes', 'skip confirmation', false)
  .action(async (name, options) => {
    try {
      const icloudBase = getICloudDrivePath();
      const configDir = getConfigDir(icloudBase, program.opts().dir);
      const db = openDb(configDir);

      if (!options.yes) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(
          chalk.yellow(`Remove "${name}"? This will delete the file from iCloud and the database record. [y/N] `)
        );
        rl.close();
        if (answer.trim().toLowerCase() !== 'y') {
          console.log('Cancelled.');
          db.close();
          return;
        }
      }

      const result = removeFile(db, { name, configDir });
      console.log(chalk.green(`Removed "${result.name}".`));
      if (result.originalPath) {
        console.log(`  Original path was: ${result.originalPath}`);
      }
      db.close();
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
