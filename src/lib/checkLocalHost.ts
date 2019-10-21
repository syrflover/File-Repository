/**
 *
 * original: https://github.com/sanketbajoria/check-localhost/blob/master/index.js
 *
 */

import * as dns from 'dns';
import * as os from 'os';
import { logger } from '../logger';
const ifaces = os.networkInterfaces();

export const checkLocalHost = (addr: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
        logger.trace('checkLocalHost()');
        // logger.debug('os.networkInterfaces() =', ifaces);

        dns.lookup(addr, (err, address) => {
            if (err) {
                resolve(false);
                return;
            }
            const address_ = address.replace(/(f|:)/gi, '');
            logger.debug('address  =', address);
            logger.debug('address_ =', address_);

            for (const ifname of Object.keys(ifaces)) {
                for (const iface of ifaces[ifname]) {
                    if (
                        iface.address === address ||
                        iface.address === address_
                    ) {
                        resolve(true);
                        return;
                    }
                }
            }

            resolve(false);
        });
    });
