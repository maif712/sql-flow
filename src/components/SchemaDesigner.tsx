import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './TableNode';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { DeleteModal } from './DeleteModal';
import { Table, Column, EdgeData, RelationType } from '../types/schema';
import { toast } from 'sonner';
import { useThemeMode } from '@/hooks/use-theme-mode';

const nodeTypes = {
  tableNode: TableNode,
};

// Custom edge styling based on relation type
const getEdgeStyle = (relationType: RelationType) => {
  switch(relationType) {
    case 'oneToOne':
      return { stroke: '#10B981', strokeWidth: 2 }; // Green for one-to-one
    case 'oneToMany':
      return { stroke: '#3B82F6', strokeWidth: 2 }; // Blue for one-to-many
    case 'manyToMany':
      return { stroke: '#8B5CF6', strokeWidth: 2 }; // Purple for many-to-many
    default:
      return { stroke: '#64748b', strokeWidth: 2 }; // Default gray
  }
};

const SchemaDesigner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  // Removed duplicate declarations below
  const [tables, setTables] = useState<Table[]>([]); // Keep local state for tables
  const { isDark } = useThemeMode();
  const LOCAL_STORAGE_KEY = 'schemaFlowData'; // Define storage key locally
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load initial data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let loadedTables: Table[] = [];
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData?.tables)) {
          loadedTables = parsedData.tables;
        }
      } catch (error) {
        console.error('Failed to parse saved data from localStorage', error);
      }
    }
    setTables(loadedTables); // Initialize local state

    // Initialize nodes based on loaded data
    const initialNodes = loadedTables.map((table, index) => ({
      id: table.id,
      type: 'tableNode' as const,
      position: {
        x: 100 + (index * 150) % 600, 
        y: 100 + Math.floor(index / 4) * 200
      },
      data: { 
        table, 
        // Pass local state modifiers
        onUpdateTable: updateTable, 
        onDeleteTable: deleteTable,
        onAddColumn: addColumn,
        onDeleteColumn: deleteColumn,
        isDark,
      },
    }));
    setNodes(initialNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Run only once on mount

  // Save tables to localStorage whenever the local state changes
  useEffect(() => {
    // Avoid saving the initial empty state before loading finishes
    // Check if it's not the very first render potentially
    if (tables.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
       try {
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ tables }));
       } catch (error) {
         console.error('Failed to save data to localStorage', error);
       }
    }
  }, [tables]);

  // Connect edges when local tables are updated
  useEffect(() => {
    updateEdgesFromTables();
  }, [tables]); // Depend on local tables
  
  // Update nodes when tables change or theme changes
  useEffect(() => {
    updateNodesFromTables();
  }, [tables, isDark]);
  
  const updateNodesFromTables = () => {
    setNodes((prevNodes) => 
      prevNodes.map((node) => {
        const tableData = tables.find(table => table.id === node.id);
        if (tableData) {
          return {
            ...node,
            data: {
              ...node.data,
              table: tableData,
              isDark,
            },
          };
        }
        return node;
      })
    );
  };
  
  const updateEdgesFromTables = () => {
    const newEdges: Edge[] = [];
    
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.isForeignKey && column.referencesTable && column.referencesColumn) {
          let sourceId = `${column.referencesTable}`;
          let targetId = `${table.id}`;
          let relationType: RelationType = 'oneToMany';
          
          // If the foreign key column is also primary key, then it's a one-to-one relationship.
          if (column.isPrimaryKey) {
            relationType = 'oneToOne';
          }
          
          // Also allow naming hints for one-to-one if needed
          if (column.name.toLowerCase().includes('one') || 
              column.name.toLowerCase().includes('single')) {
            relationType = 'oneToOne';
            sourceId = `${table.id}`;
            targetId = `${column.referencesTable}`;
          }
          
          // Identify junction table for many-to-many (if table has two or more FK columns)
          const potentialJunctionTable = table.columns.filter(c => c.isForeignKey).length >= 2;
          if (potentialJunctionTable && relationType !== 'oneToOne') {
            relationType = 'manyToMany';
          }
          
          const edgeExists = newEdges.some(
            edge => edge.source === sourceId && edge.target === targetId && 
                   ((edge.sourceHandle === column.referencesColumn && edge.targetHandle === column.id) ||
                    (edge.sourceHandle === column.id && edge.targetHandle === column.referencesColumn))
          );
          
          if (!edgeExists) {
            const edgeStyle = getEdgeStyle(relationType);
            const edgeLabel = relationType === 'oneToOne' ? '1:1' : 
                              relationType === 'oneToMany' ? '1:n' : 'n:m';
          
            newEdges.push({
              id: `${column.id}-${column.referencesColumn}`,
              source: sourceId,
              target: targetId,
              sourceHandle: column.referencesColumn,
              targetHandle: column.id,
              type: 'smoothstep',
              animated: true,
              style: edgeStyle,
              label: edgeLabel,
              labelStyle: { fill: '#fff', fontWeight: 700 },
              labelBgStyle: { fill: '#334155' },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: edgeStyle.stroke,
              },
              data: {
                type: 'foreignKey',
                sourceTable: sourceId,
                targetTable: targetId,
                sourceColumn: column.referencesColumn,
                targetColumn: column.id,
                relationType: relationType,
              } as EdgeData
            });
          }
        }
      });
    });
    
    setEdges(newEdges);
  };

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
      return;
    }

    const sourceTable = tables.find(table => table.id === params.source);
    const targetTable = tables.find(table => table.id === params.target);
    
    if (!sourceTable || !targetTable) return;
    
    const sourceColumn = sourceTable.columns.find(column => column.id === params.sourceHandle);
    const targetColumn = targetTable.columns.find(column => column.id === params.targetHandle);
    
    if (!sourceColumn || !targetColumn) return;
    
    const updatedSourceColumn: Column = {
      ...sourceColumn,
      isForeignKey: true,
      referencesTable: targetTable.id,
      referencesColumn: targetColumn.id,
    };
    
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === sourceTable.id
          ? {
              ...table,
              columns: table.columns.map(column =>
                column.id === sourceColumn.id ? updatedSourceColumn : column
              ),
            }
          : table
      )
    );
    
    toast.success(`Created relationship from ${sourceTable.name}.${sourceColumn.name} to ${targetTable.name}.${targetColumn.name}`);
  }, [tables, setTables]);

  const addTable = useCallback(() => {
    const id = `table-${Date.now()}`;
    const tableName = `Table ${tables.length + 1}`;
    
    const newTable: Table = {
      id,
      name: tableName,
      columns: [],
    };
    
    setTables((prevTables) => [...prevTables, newTable]);
    
    const position = {
      x: 100 + (tables.length * 50) % 300,
      y: 100 + (tables.length * 50) % 300
    };
    
    setNodes((nds) => nds.concat({
      id,
      type: 'tableNode',
      position,
      data: { 
        table: newTable,
        onUpdateTable: updateTable,
        onDeleteTable: deleteTable,
        onAddColumn: addColumn,
        onDeleteColumn: deleteColumn,
        isDark,
      },
    }));
    
    toast.success(`Created table: ${tableName}`);
  }, [tables, setNodes, setTables, isDark]);
  
  const deleteTable = useCallback((tableId: string) => {
    setTables(prevTables => prevTables.filter(table => table.id !== tableId));
    
    setNodes(prevNodes => prevNodes.filter(node => node.id !== tableId));
    
    setEdges(prevEdges => 
      prevEdges.filter(edge => 
        edge.source !== tableId && edge.target !== tableId
      )
    );
    
    toast.success("Table deleted");
  }, [setTables, setNodes, setEdges]);
  
  const updateTable = useCallback((updatedTable: Table) => {
    setTables((prevTables) => 
      prevTables.map((table) => 
        table.id === updatedTable.id ? updatedTable : table
      )
    );
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === updatedTable.id) {
          return {
            ...node,
            data: { 
              ...node.data, 
              table: updatedTable,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes, setTables]);

  const addColumn = useCallback((tableId: string) => {
    const timestamp = Date.now();
    const columnId = `${tableId}-col-${timestamp}`;
    
    setTables((prevTables) => {
      const updatedTables = prevTables.map((table) => {
        if (table.id === tableId) {
          const newColumn: Column = {
            id: columnId,
            name: `column_${table.columns.length + 1}`,
            type: 'VARCHAR(255)',
            isPrimaryKey: table.columns.length === 0,
            isForeignKey: false,
            referencesTable: '',
            referencesColumn: '',
            isNullable: true,
          };
          
          return {
            ...table,
            columns: [...table.columns, newColumn],
          };
        }
        return table;
      });
      
      return updatedTables;
    });
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === tableId) {
          const tableData = node.data.table;
          const newColumn: Column = {
            id: columnId,
            name: `column_${tableData.columns.length + 1}`,
            type: 'VARCHAR(255)',
            isPrimaryKey: tableData.columns.length === 0,
            isForeignKey: false,
            referencesTable: '',
            referencesColumn: '',
            isNullable: true,
          };
          
          return {
            ...node,
            data: {
              ...node.data,
              table: {
                ...tableData,
                columns: [...tableData.columns, newColumn],
              },
            },
          };
        }
        return node;
      })
    );
    
    toast.success("Column added");
  }, [setTables, setNodes]);
  
  const deleteColumn = useCallback((tableId: string, columnId: string) => {
    setTables((prevTables) => 
      prevTables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            columns: table.columns.filter(column => column.id !== columnId),
          };
        }
        return table;
      })
    );
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === tableId) {
          const tableData = node.data.table;
          return {
            ...node,
            data: {
              ...node.data,
              table: {
                ...tableData,
                columns: tableData.columns.filter(column => column.id !== columnId),
              },
            },
          };
        }
        return node;
      })
    );
    
    setEdges(prevEdges => 
      prevEdges.filter(edge => 
        edge.sourceHandle !== columnId && edge.targetHandle !== columnId
      )
    );
    
    toast.success("Column deleted");
  }, [setTables, setNodes, setEdges]);

  const isPotentialForeignKey = (columnName: string) => {
    const lcName = columnName.toLowerCase();
    return lcName.endsWith('_id') || 
           lcName.endsWith('id') ||
           lcName.includes('_id_') ||
           lcName === 'id' ||
           lcName.includes('foreign');
  };

  const getPotentialTableName = (columnName: string) => {
    const cleanName = columnName.toLowerCase()
      .replace(/_id$/, '')
      .replace(/id$/, '')
      .replace(/_/g, ' ');
    return cleanName.split(' ')[0];
  };

  const tableNamesMatch = (tableName: string, potentialMatch: string) => {
    const lcTable = tableName.toLowerCase();
    const lcMatch = potentialMatch.toLowerCase();
    
    if (lcTable === lcMatch) return true;
    
    if (lcTable === `${lcMatch}s` || `${lcTable}s` === lcMatch) return true;
    if (lcTable === `${lcMatch}es` || `${lcTable}es` === lcMatch) return true;
    
    const irregulars: Record<string, string> = {
      'person': 'people',
      'child': 'children',
      'mouse': 'mice'
    };
    if (irregulars[lcTable] === lcMatch || irregulars[lcMatch] === lcTable) return true;
    
    return false;
  };

  const detectRelations = useCallback(() => {
    let relationsFound = 0;
    
    clearRelations();
    
    tables.forEach(sourceTable => {
      sourceTable.columns.forEach(sourceColumn => {
        if (isPotentialForeignKey(sourceColumn.name)) {
          const potentialTableName = getPotentialTableName(sourceColumn.name);
          
          tables.forEach(targetTable => {
            if (sourceTable.id !== targetTable.id && 
                (tableNamesMatch(targetTable.name, potentialTableName) || 
                 sourceColumn.name.toLowerCase() === 'id')) {
              targetTable.columns.forEach(targetColumn => {
                if (targetColumn.isPrimaryKey) {
                  const updatedSourceColumn = {
                    ...sourceColumn,
                    isForeignKey: true,
                    referencesTable: targetTable.id,
                    referencesColumn: targetColumn.id,
                  };
                  
                  setTables(prevTables =>
                    prevTables.map(table =>
                      table.id === sourceTable.id
                        ? {
                            ...table,
                            columns: table.columns.map(column =>
                              column.id === sourceColumn.id ? updatedSourceColumn : column
                            ),
                          }
                        : table
                    )
                  );
                  
                  relationsFound++;
                }
              });
            }
          });
        }
      });
    });
    
    if (relationsFound > 0) {
      toast.success(`Detected ${relationsFound} potential relationships`);
    } else {
      toast.info("No potential relationships detected");
    }
  }, [tables, setTables]);
  
  const clearRelations = useCallback(() => {
    setTables(prevTables =>
      prevTables.map(table => ({
        ...table,
        columns: table.columns.map(column => ({
          ...column,
          isForeignKey: false,
          referencesTable: '',
          referencesColumn: ''
        }))
      }))
    );
    
    setEdges([]);
    
    toast.info("All relationships cleared");
  }, [setTables, setEdges]);

  const generateSqlScript = useCallback(() => {
    let sql = '';
    
    tables.forEach((table) => {
      sql += `CREATE TABLE ${table.name} (\n`;
      
      const columnDefinitions = table.columns.map((column) => {
        let def = `  ${column.name} ${column.type}`;
        
        if (column.isPrimaryKey) {
          def += ' PRIMARY KEY';
        }
        
        if (!column.isNullable) {
          def += ' NOT NULL';
        }
        
        return def;
      });
      
      sql += columnDefinitions.join(',\n');
      
      const foreignKeys = table.columns.filter(column => column.isForeignKey);
      if (foreignKeys.length > 0) {
        sql += ',\n';
        
        const foreignKeyConstraints = foreignKeys.map((column) => {
          const referencedTable = tables.find(t => t.id === column.referencesTable);
          const referencedColumn = referencedTable?.columns.find(c => c.id === column.referencesColumn);
          
          if (referencedTable && referencedColumn) {
            return `  FOREIGN KEY (${column.name}) REFERENCES ${referencedTable.name} (${referencedColumn.name})`;
          }
          return '';
        }).filter(Boolean);
        
        sql += foreignKeyConstraints.join(',\n');
      }
      
      sql += '\n);\n\n';
    });
    
    return sql;
  }, [tables]);

  const updateTablesFromSql = useCallback((sql: string) => {
    try {
      // Validate SQL has at least one complete CREATE TABLE statement
      if (!sql.includes('CREATE TABLE') || !sql.includes('(') || !sql.includes(')')) {
        throw new Error('Invalid SQL - missing CREATE TABLE statement or parentheses');
      }

      // Check for unclosed statements
      if ((sql.match(/\(/g) || []).length !== (sql.match(/\)/g) || []).length) {
        throw new Error('Unclosed parentheses in SQL');
      }

      // Check for missing semicolons
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      if (statements.length > 0 && !sql.trim().endsWith(';')) {
        throw new Error('Missing semicolon at end of SQL statement');
      }

      const createTableStatements = sql.match(/CREATE\s+TABLE\s+([^\s(]+)\s*\(\s*([^;]+?)\s*\)\s*;/gis);
      
      if (!createTableStatements || createTableStatements.length === 0) {
        throw new Error('No valid CREATE TABLE statements found');
      }

      const newTables: Table[] = [];
      
      createTableStatements.forEach(statement => {
        const tableNameMatch = statement.match(/CREATE\s+TABLE\s+([^\s(]+)/i);
        if (!tableNameMatch) {
          throw new Error('Could not parse table name');
        }
        
        const tableName = tableNameMatch[1].replace(/["']/g, '');
        const tableId = `table-${Date.now()}-${tableName}`;
        
        const columnsBlock = statement.match(/\(\s*([^;]+?)\s*\)\s*;/is)?.[1];
        if (!columnsBlock) {
          throw new Error('Could not parse columns block');
        }
        
        const columnLines = columnsBlock.split(',').map(line => line.trim()).filter(line => line && !line.startsWith('FOREIGN KEY'));
        
        const columns: Column[] = columnLines.map((line, index) => {
          const parts = line.split(/\s+/);
          let name = parts[0].replace(/["']/g, '').trim();
          if (!name) {
            throw new Error(`Invalid column name in line: ${line}`);
          }
          let type = parts[1] || 'VARCHAR(255)';
          let isPrimaryKey = line.toUpperCase().includes('PRIMARY KEY');
          let isNullable = !line.toUpperCase().includes('NOT NULL');
          
          return {
            id: `${tableId}-col-${index}`,
            name,
            type: type.toUpperCase(),
            isPrimaryKey,
            isForeignKey: false,
            referencesTable: '',
            referencesColumn: '',
            isNullable
          };
        });
        
        newTables.push({
          id: tableId,
          name: tableName,
          columns
        });
      });
      
      setTables(newTables);
      
      const newNodes = newTables.map((table, index) => ({
        id: table.id,
        type: 'tableNode' as const,
        position: {
          x: 100 + (index * 50) % 300,
          y: 100 + (index * 50) % 300
        },
        data: { 
          table, 
          onUpdateTable: updateTable,
          onDeleteTable: deleteTable,
          onAddColumn: addColumn,
          onDeleteColumn: deleteColumn,
          isDark,
        },
      }));
      
      setNodes(newNodes);
      toast.success("SQL applied successfully");
      
    } catch (error) {
      console.error("SQL Parsing Error:", error);
      toast.error(`SQL Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [setTables, setNodes, updateTable, deleteTable, addColumn, deleteColumn]);

  const removeAllTables = useCallback(() => {
    setTables([]);
    setNodes([]);
  }, []);

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            removeAllTables();
            setShowDeleteModal(false);
          }}
        />
      )}
      <div className="flex h-full">
        <Sidebar 
          addTable={addTable}
          tables={tables}
          detectRelations={detectRelations}
          clearRelations={clearRelations}
          onTableSelect={setSelectedTableId}
          removeAllTables={() => setShowDeleteModal(true)}
        />
        <div className="flex-grow h-full relative">
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              selected: false, // Disable ReactFlow's default selection
              className: node.id === selectedTableId
                ? 'z-10 shadow-table-glow'
                : '',
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            onPaneClick={() => setSelectedTableId(null)} // Clear selection when clicking empty space
          >
          <Controls className={`${isDark ? 'bg-card border-border' : 'bg-card border-border'} border rounded-md`} />
          <MiniMap 
            nodeColor={(node) => isDark ? '#ffffff' : '#1F2937'}
            nodeStrokeColor={() => isDark ? '#333333' : '#e5e7eb'}
            maskColor={isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(240, 242, 245, 0.7)"}
            className={`${isDark ? 'bg-card border-border' : 'bg-card border-border'} border rounded-md`}
          />
          <Background color={isDark ? "#374151" : "#cbd5e1"} gap={16} />
        </ReactFlow>
        </div>
        <RightSidebar 
          tables={tables}
          generateSqlScript={generateSqlScript}
          updateTablesFromSql={updateTablesFromSql}
        />
      </div>
    </>
  );
};

export default SchemaDesigner;
