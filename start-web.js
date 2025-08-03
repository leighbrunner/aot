const { spawn } = require('child_process');
const os = require('os');

// Kill any process running on port 8084
const killPort = () => {
  return new Promise((resolve) => {
    const command = os.platform() === 'win32' 
      ? `netstat -ano | findstr :8084`
      : `lsof -ti:8084`;
    
    const killCommand = os.platform() === 'win32'
      ? 'taskkill /PID %PID% /F'
      : 'kill -9';

    const check = spawn(command, [], { shell: true });
    
    check.stdout.on('data', (data) => {
      const pid = data.toString().trim();
      if (pid) {
        const kill = spawn(`${killCommand} ${pid}`, [], { shell: true });
        kill.on('close', () => {
          console.log('Killed process on port 8084');
          resolve();
        });
      } else {
        resolve();
      }
    });

    check.on('error', () => resolve());
    check.on('close', () => resolve());
  });
};

// Start the web server
const startWeb = async () => {
  await killPort();
  
  console.log('Starting Expo web on port 8084...');
  
  const expo = spawn('npx', ['expo', 'start', '--web', '--port', '8084'], {
    stdio: 'inherit',
    shell: true
  });

  expo.on('error', (err) => {
    console.error('Failed to start Expo:', err);
    process.exit(1);
  });

  expo.on('close', (code) => {
    if (code !== 0) {
      console.error(`Expo process exited with code ${code}`);
      process.exit(code);
    }
  });
};

startWeb();