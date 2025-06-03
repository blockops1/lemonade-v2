import { packageInfo as injectInfo } from '@polkadot/extension-inject/packageInfo';
import { detectPackage } from '@polkadot/util';
import { packageInfo } from './packageInfo.js';
detectPackage(packageInfo, null, [injectInfo]);
