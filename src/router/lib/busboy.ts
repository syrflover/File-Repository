import { IncomingMessage } from 'http';
import { createWriteStream } from 'fs';

import * as Busboy from 'busboy';

import { logger } from '../../logger';

export const busboy = (
    savePath: string,
    req: IncomingMessage,
): Promise<{ size: number }> =>
    new Promise((resolve, reject) => {
        const parser = new Busboy({ headers: req.headers });

        let size = 0;

        parser.on('file', (fieldName, file, fileName, encoding, mimeType) => {
            logger.debug('field_name =', fieldName);
            logger.debug('file_name =', fileName);
            logger.debug('encoding =', encoding);
            logger.debug('mime_type =', mimeType);

            file.on('data', (chunk: Buffer) => {
                size += chunk.byteLength;
            });

            parser.on('finish', () => {
                logger.trace('parser end');
                resolve({
                    size,
                });
            });

            file.pipe(createWriteStream(savePath));
        });

        parser.on('error', (error: any) => {
            reject(error);
        });

        req.pipe(parser);
    });
