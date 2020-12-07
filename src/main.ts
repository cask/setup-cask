import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

function extension(element: string) {
  var extName = path.extname(element);
  return true;
}

function seekDir(dirpath: string) {
  fs.readdir(dirpath, function(err, list) {
    if (list !== undefined) {
      list.filter(extension).forEach(function(value) {
        console.log(dirpath + '\\' + value);
      });

      list.forEach(function(value) {
        let nextDir: string = dirpath + '\\' + value;
        if (fs.statSync(nextDir).isDirectory()) {
          seekDir(nextDir);
        }
      });
    }
  });
}

async function run() {
  try {
    const version =
      core.getInput('version') == 'snapshot'
        ? 'master'
        : core.getInput('version');
    const archive_name =
      core.getInput('version') == 'snapshot' ? 'master.zip' : `v${version}.zip`;
    const home = os.homedir();
    const tmp = os.tmpdir();

    core.startGroup('Fetch Cask');
    if (version == 'local') {
      const options = {recursive: true, force: false};
      await io.mv(`./src/cask-local`, `${home}/.cask`, options);
      seekDir('./src');
    } else {
      await exec.exec('curl', [
        '-L',
        `https://github.com/cask/cask/archive/${archive_name}`,
        '-o',
        `${tmp}/${archive_name}`
      ]);
      await exec.exec('unzip', [`${tmp}/${archive_name}`, '-d', `${tmp}`]);
      const options = {recursive: true, force: false};
      await io.mv(`${tmp}/cask-${version}`, `${home}/.cask`, options);
    }
    core.addPath(`${home}/.cask/bin`);
    core.endGroup();

    core.startGroup('Install dependency');
    await exec.exec('cask', ['--version']);
    core.endGroup();

    // show Cask version
    await exec.exec('cask', ['--version']);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
