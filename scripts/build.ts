/* eslint-disable */
// @ts-nocheck

import { spawn } from 'child_process';

const runBuildCommand = () => {
  const buildProcess = spawn('bun', ['tauri', 'build']);

  const onData = (data: string) => {
    const output = data.toString();
    process.stdout.write(output);

    // match for `Finished 1 bundle at:` or `Finished 2 bundles at:`
    if (/Finished \d+ bundles? at:/.test(output)) {
      console.log('Build process finished. Exiting...');
      buildProcess.kill();
      process.exit(0);
    }
  };

  buildProcess.stdout.on('data', onData);

  buildProcess.stderr.on('data', onData);

  buildProcess.on('close', (code) => {
    console.log(`Build process exited with code ${code}`);
  });
};

runBuildCommand();
