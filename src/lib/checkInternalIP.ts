/**
 *
 * original: https://github.com/sanketbajoria/check-localhost/blob/master/index.js
 *
 */

import * as dns from 'dns';
import * as os from 'os';
import { logger } from '../logger';
import { env } from '../env';
const ifaces = os.networkInterfaces();

export const checkInternalIP = (addr: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
        logger.trace('checkInternalIP()');
        // logger.debug('os.networkInterfaces() =', ifaces);

        dns.lookup(addr, (err, address) => {
            if (err) {
                resolve(false);
                return;
            }

            const rangeOfInternalIP = env.INTERNAL_IP.replace('*', '').trim();
            const proxyIP = env.PROXY_IP;
            // const address_ = address.replace(/(f|:)/gi, '');
            const address_ = address.replace(/[^.0-9]/gi, '');
            logger.debug('address  =', address);
            logger.debug('address_ =', address_);

            if (address_ === '127.0.0.1' || address_ === '1') {
                resolve(true);
                return;
            }

            for (const ifname of Object.keys(ifaces)) {
                for (const iface of ifaces[ifname]) {
                    logger.debug(iface.address, address, address_);

                    if (address.startsWith(proxyIP) || address_.startsWith(proxyIP)) {
                        resolve(false);
                        return;
                    }

                    if (address.startsWith(rangeOfInternalIP) || address_.startsWith(rangeOfInternalIP)) {
                        resolve(true);
                        return;
                    }
                }
            }

            resolve(false);
        });
    });
