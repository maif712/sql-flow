
import React, { useCallback, useState, memo, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Table, Column } from '../types/schema';
import { Key, Link2, Trash2, Plus, Edit2 } from 'lucide-react';

type TableNodeProps = {
  data: {
    table: Table;
    onUpdateTable: (updatedTable: Table) => void;
    onDeleteTable: (tableId: string) => void;
    onAddColumn: (tableId: string) => void;
    onDeleteColumn: (tableId: string, columnId: string) => void;
  };
  isConnectable: boolean;
};

const TableNode = ({ data, isConnectable }: TableNodeProps) => {
  const { table, onUpdateTable, onDeleteTable, onAddColumn, onDeleteColumn } = data;
  const [isEditing, setIsEditing] = useState(table.columns.length === 0);
  const [tableName, setTableName] = useState(table.name);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState(table.columns);

  // Update localColumns when table.columns change
  useEffect(() => {
    setLocalColumns(table.columns);
  }, [table.columns]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTableName(e.target.value);
  }, []);

  const handleNameBlur = useCallback(() => {
    setIsEditing(false);
    onUpdateTable({
      ...table,
      name: tableName || table.name,
    });
  }, [onUpdateTable, table, tableName]);

  const handleColumnNameChange = useCallback((columnId: string, name: string) => {
    onUpdateTable({
      ...table,
      columns: table.columns.map((column) =>
        column.id === columnId ? { ...column, name } : column
      ),
    });
  }, [onUpdateTable, table]);

  const handleColumnTypeChange = useCallback((columnId: string, type: string) => {
    onUpdateTable({
      ...table,
      columns: table.columns.map((column) =>
        column.id === columnId ? { ...column, type } : column
      ),
    });
  }, [onUpdateTable, table]);

  const togglePrimaryKey = useCallback((columnId: string) => {
    onUpdateTable({
      ...table,
      columns: table.columns.map((column) =>
        column.id === columnId ? { ...column, isPrimaryKey: !column.isPrimaryKey } : column
      ),
    });
  }, [onUpdateTable, table]);

  const toggleForeignKey = useCallback((columnId: string) => {
    onUpdateTable({
      ...table,
      columns: table.columns.map((column) =>
        column.id === columnId ? { 
          ...column, 
          isForeignKey: !column.isForeignKey,
          referencesTable: column.isForeignKey ? '' : column.referencesTable,
          referencesColumn: column.isForeignKey ? '' : column.referencesColumn,
        } : column
      ),
    });
  }, [onUpdateTable, table]);

  const toggleNullable = useCallback((columnId: string) => {
    onUpdateTable({
      ...table,
      columns: table.columns.map((column) =>
        column.id === columnId ? { ...column, isNullable: !column.isNullable } : column
      ),
    });
  }, [onUpdateTable, table]);

  // New handler for adding column directly from the TableNode
  const handleAddColumn = useCallback(() => {
    onAddColumn(table.id);
    // Immediately focus on the latest column for editing
    setTimeout(() => {
      const newColumnId = `${table.id}-col-${Date.now()}`;
      setEditingColumnId(newColumnId);
    }, 50);
  }, [table.id, onAddColumn]);

  return (
    <div className="rounded-md overflow-hidden bg-[hsl(var(--table-background))] border border-[hsl(var(--table-border))] shadow-lg transition-table" style={{ minWidth: '280px' }}>
      {/* Table Header */}
      <div className="bg-[hsl(var(--table-header))] px-4 py-3 flex justify-between items-center text-[hsl(var(--table-text))] transition-table">
        {isEditing ? (
          <input
            type="text"
            value={tableName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNameBlur();
              }
            }}
            className="bg-[hsl(var(--muted))] text-[hsl(var(--table-text))] px-3 py-1 rounded-md outline-none border border-[hsl(var(--accent))] w-full"
            autoFocus
          />
        ) : (
          <div className="flex items-center flex-1">
            <h3 className="text-[hsl(var(--table-text))] font-bold text-lg">
              {table.name}
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="ml-2 text-[hsl(var(--table-text-secondary))] hover:text-[hsl(var(--table-text))] p-1 rounded-md hover:bg-[hsl(var(--accent))]/20 transition-button"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddColumn}
            className="text-[hsl(var(--table-text-secondary))] hover:text-[hsl(var(--table-text))] p-1 rounded-md hover:bg-[hsl(var(--accent))]/20 transition-button"
            title="Add Column"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => onDeleteTable(table.id)}
            className="text-[hsl(var(--table-text-secondary))] hover:text-[hsl(var(--destructive))] p-1 rounded-md hover:bg-[hsl(var(--destructive))]/10 transition-button"
            title="Delete Table"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Columns Container */}
      <div className="bg-[hsl(var(--table-background))] transition-table">
        {localColumns.length === 0 ? (
          <div className="text-center text-[hsl(var(--table-text-secondary))] py-6 italic text-sm">
            No columns yet. Click the + button to add a column.
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--table-divider))]">
            {/* Column Header Row */}
            <div className="grid grid-cols-3 bg-[hsl(var(--table-header))] text-[hsl(var(--table-text-secondary))] text-xs font-semibold transition-table">
              <div className="py-2 px-3">NAME</div>
              <div className="py-2 px-3">TYPE</div>
              <div className="py-2 px-3 text-right">CONSTRAINTS</div>
            </div>
            
            {/* Column Rows */}
            {localColumns.map((column) => (
              <div 
                key={column.id} 
                className="relative"
                onMouseEnter={() => setHoveredRow(column.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {editingColumnId === column.id ? (
                  // Editing Mode
                  <div className="grid grid-cols-1 gap-2 p-3 bg-[hsl(var(--muted))] rounded-md"> {/* Keep muted for edit background */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                        className="flex-1 px-3 py-2 bg-[hsl(var(--background))] text-[hsl(var(--table-text))] rounded-md border border-[hsl(var(--accent))]/50"
                        autoFocus
                        placeholder="Column name"
                      />
                      <select
                        value={column.type}
                        onChange={(e) => handleColumnTypeChange(column.id, e.target.value)}
                        className="px-3 py-2 bg-[hsl(var(--background))] text-[hsl(var(--table-text))] rounded-md border border-[hsl(var(--accent))]/50"
                      >
                        <option value="INT">INT</option>
                        <option value="BIGINT">BIGINT</option>
                        <option value="UUID">UUID</option>
                        <option value="TEXT">TEXT</option>
                        <option value="VARCHAR(50)">VARCHAR(50)</option>
                        <option value="VARCHAR(255)">VARCHAR(255)</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="DATE">DATE</option>
                        <option value="TIMESTAMP">TIMESTAMP</option>
                        <option value="DECIMAL">DECIMAL</option>
                        <option value="FLOAT">FLOAT</option>
                        <option value="JSONB">JSONB</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm mt-2">
                      <label className="flex items-center gap-1 cursor-pointer bg-[hsl(var(--background))] px-2 py-1 rounded-md hover:bg-[hsl(var(--accent))]/10 transition-button">
                        <input
                          type="checkbox"
                          checked={column.isPrimaryKey}
                          onChange={() => togglePrimaryKey(column.id)}
                          className="w-3 h-3"
                        />
                        <span className="text-[hsl(var(--table-text))]">Primary Key</span>
                      </label>
                      
                      <label className="flex items-center gap-1 cursor-pointer bg-[hsl(var(--background))] px-2 py-1 rounded-md hover:bg-[hsl(var(--accent))]/10 transition-button">
                        <input
                          type="checkbox"
                          checked={column.isForeignKey}
                          onChange={() => toggleForeignKey(column.id)}
                          className="w-3 h-3"
                        />
                        <span className="text-[hsl(var(--table-text))]">Foreign Key</span>
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer bg-[hsl(var(--background))] px-2 py-1 rounded-md hover:bg-[hsl(var(--accent))]/10 transition-button">
                        <input
                          type="checkbox"
                          checked={!column.isNullable}
                          onChange={() => toggleNullable(column.id)}
                          className="w-3 h-3"
                        />
                        <span className="text-[hsl(var(--table-text))]">NOT NULL</span>
                      </label>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={() => setEditingColumnId(null)}
                        className="px-4 py-2 bg-[hsl(var(--table-button-bg))] text-[hsl(var(--primary-foreground))] text-sm rounded-md hover:bg-[hsl(var(--table-button-hover))] transition-button"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode (similar to the image design)
                  <div className="grid grid-cols-3 text-[hsl(var(--table-text))] py-2 px-3 hover:bg-[hsl(var(--table-row-hover))] items-center transition-table">
                    <div className="font-medium truncate">{column.name}</div>
                    <div className="text-[hsl(var(--table-text-secondary))] text-sm">{column.type.toLowerCase()}</div>
                    <div className="flex justify-end space-x-2">
                      {column.isPrimaryKey && (
                        <span className="inline-flex items-center" title="Primary Key">
                          <Key size={14} className="text-yellow-400" />
                        </span>
                      )}
                      {column.isForeignKey && (
                        <span className="inline-flex items-center" title="Foreign Key">
                          <Link2 size={14} className="text-blue-400" />
                        </span>
                      )}
                      {!column.isNullable && (
                        <span className="text-xs text-[hsl(var(--table-text-secondary))] font-semibold" title="Not Nullable">
                          NN
                        </span>
                      )}
                    </div>
                    
                    {/* Action buttons visible on hover */}
                    {hoveredRow === column.id && (
                      <div className="absolute right-0 top-0 h-full flex items-center bg-[hsl(var(--table-header))] pr-3">
                        <button
                          onClick={() => setEditingColumnId(column.id)}
                          className="p-1 text-[hsl(var(--table-text-secondary))] hover:text-[hsl(var(--table-text))] rounded-md hover:bg-[hsl(var(--accent))]/10 transition-button"
                          title="Edit Column"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteColumn(table.id, column.id)}
                          className="p-1 text-[hsl(var(--table-text-secondary))] hover:text-[hsl(var(--destructive))] rounded-md hover:bg-[hsl(var(--destructive))]/10 transition-button ml-1"
                          title="Delete Column"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Handles for connections */}
                {isConnectable && (
                  <>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={column.id}
                      className="w-3 h-3 bg-[hsl(var(--accent))] border-2 border-[hsl(var(--table-background))]"
                      isConnectable={isConnectable}
                    />
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={column.id}
                      className="w-3 h-3 bg-[hsl(var(--accent))] border-2 border-[hsl(var(--table-background))]"
                      isConnectable={isConnectable}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TableNode);
