import * as fs from 'fs';
import * as mimetypes from 'mime-types';
import { MigrationInterface, QueryRunner } from 'typeorm';
import File from '../entity/File';
import { parseFilePathFromString } from '../lib/parseFilePath';

export class MigrationFromLocalFiles1571905140444
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const directories = await fs.promises.readdir(
            '/madome/file/image/library',
        );

        for (const directory of directories) {
            const files = await fs.promises.readdir(
                `/madome/file/image/library/${directory}`,
            );

            for (const file of files) {
                const stat = await fs.promises.stat(
                    `/madome/file/image/library/${directory}/${file}`,
                );

                const filepath = parseFilePathFromString(
                    `image/library/${directory}/${file}`,
                );
                const content_type = mimetypes.lookup(file);
                const content_length = stat.size;

                if (!content_type) {
                    throw new Error('Invalid File Extension');
                }

                const newFile = new File();
                newFile.path = filepath;
                newFile.content_type = content_type;
                newFile.content_length = content_length;
                newFile.created_at = stat.birthtime;
                newFile.updated_at = stat.birthtime;

                await queryRunner.manager.save(File, newFile);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {}
}
