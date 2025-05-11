
export type RelationType = 'oneToOne' | 'oneToMany' | 'manyToMany';

export type Column = {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable: string;
  referencesColumn: string;
  isNullable: boolean;
};

export type Table = {
  id: string;
  name: string;
  columns: Column[];
};

export type EdgeData = {
  type: 'foreignKey';
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  relationType: RelationType;
};
