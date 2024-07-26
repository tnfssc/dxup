import { spawn } from 'child_process';

const runBuildCommand = () => {
  const buildProcess = spawn('bun', ['tauri', 'build']);

  const onData = (data: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const output = data.toString();
    process.stdout.write(output);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (output.includes('bundles at:')) {
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
