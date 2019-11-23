import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';
import * as os from 'os';

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
    await exec.exec('curl', [
      '-L',
      `https://github.com/cask/cask/archive/${archive_name}`,
      '-o',
      `${tmp}/${archive_name}`
    ]);
    await exec.exec('unzip', [`${tmp}/${archive_name}`, '-d', `${tmp}`]);
    const options = {recursive: true, force: false};
    await io.mv(`${tmp}/cask-${version}`, `${home}/.cask`, options);
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
