import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppVersionsTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create app_versions table
    await queryRunner.createTable(
      new Table({
        name: 'app_versions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'appliedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'migrationsRun',
            type: 'text',
            default: "''",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rollbackScript',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on version
    await queryRunner.createIndex(
      'app_versions',
      new TableIndex({
        name: 'IDX_app_versions_version',
        columnNames: ['version'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('app_versions', 'IDX_app_versions_version');

    // Drop table
    await queryRunner.dropTable('app_versions');
  }
}
