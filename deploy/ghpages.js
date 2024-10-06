import ghpages from 'gh-pages';

import path from 'path';
import { fileURLToPath } from 'url';

// 獲取當前模組的文件名
const __filename = fileURLToPath(import.meta.url);
// 獲取當前模組的目錄名
const __dirname = path.dirname(__filename);

const options = {
    branch: 'gh-pages',
    repo: 'https://github.com/Lcwei-0708/Earthquake_Visualization.git'
};

const callback = err => {

    if (err) console.error(err);
    else console.log('publish success');
};

ghpages.publish(path.resolve(__dirname, '../dist'), options, callback);