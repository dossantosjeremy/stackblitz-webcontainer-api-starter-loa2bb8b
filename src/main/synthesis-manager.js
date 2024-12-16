const { spawn } = require('child_process');

class SynthesisManager {
  async synthesizeClips({ text, type, template }) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', ['synthesize.py'], { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdoutData = '';
      let stderrData = '';

      const input = JSON.stringify({ text, type, template });
      pythonProcess.stdin.write(input);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Synthesis failed with exit code ${code}. Error: ${stderrData}`));
        } else {
          resolve(stdoutData);
        }
      });
    });
  }
}

module.exports = { SynthesisManager };