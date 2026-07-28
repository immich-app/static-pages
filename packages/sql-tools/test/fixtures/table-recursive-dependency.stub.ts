import { ForeignKeyColumn, PrimaryColumn, Table } from 'src';

@Table('stack')
export class StackTable {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @ForeignKeyColumn(() => AssetTable)
  primaryAssetId!: string;
}

@Table('asset')
export class AssetTable {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @ForeignKeyColumn(() => StackTable)
  stackId!: string;
}

export const description = 'should work with inter-dependent tables';
