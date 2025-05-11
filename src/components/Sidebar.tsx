import React, { useState, useRef, useEffect } from 'react';
import { Database, Plus, SearchCheck, ArrowRightLeft, TableIcon, Trash } from 'lucide-react';
import { Table } from '../types/schema';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

type SidebarProps = {
  addTable: () => void;
  tables: Table[];
  detectRelations: () => void;
  clearRelations: () => void;
  onTableSelect: (tableId: string) => void; // Added callback prop
  removeAllTables: () => void;
};

const Sidebar = ({ addTable, tables, detectRelations, clearRelations, onTableSelect, removeAllTables }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [keepExpanded, setKeepExpanded] = useState(false); // new state to keep sidebar open
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Add delay before expanding
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // If the pointer is over an interactive element (like ThemeSwitcher), don’t collapse.
    if (keepExpanded) return;
    setIsExpanded(false);
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={sidebarRef}
      className={`bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full transition-all duration-300 overflow-hidden ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full p-3">
        <div className="flex items-center mb-6 justify-center">
          <div className="flex justify-center w-10 h-10 items-center">
            <Database className="h-5 w-5 text-accent" />
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={addTable}
            className="w-full flex items-center transition-all duration-300 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground py-2 rounded-md"
            style={{
              paddingLeft: isExpanded ? '1rem' : '0',
              paddingRight: isExpanded ? '1rem' : '0',
              justifyContent: isExpanded ? 'flex-start' : 'center'
            }}
          >
            <div className="flex justify-center w-10 h-5 items-center">
              <Plus className="h-5 w-5" />
            </div>
            <span 
              className={`transition-all duration-300 whitespace-nowrap ${
                isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'
              }`}
            >
              Add Table
            </span>
          </button>
          
          <button 
            onClick={detectRelations}
            className={`w-full text-sidebar-primary-foreground py-2 rounded-md flex items-center transition-all duration-300 ${
              tables.length < 2 ? 'bg-sidebar-primary/50 cursor-not-allowed' : 'bg-sidebar-primary hover:bg-sidebar-primary/90'
            }`}
            disabled={tables.length < 2}
            style={{
              paddingLeft: isExpanded ? '1rem' : '0',
              paddingRight: isExpanded ? '1rem' : '0',
              justifyContent: isExpanded ? 'flex-start' : 'center'
            }}
          >
            <div className="flex justify-center w-10 h-5 items-center">
              <SearchCheck className="h-5 w-5" />
            </div>
            <span 
              className={`transition-all duration-300 whitespace-nowrap ${
                isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'
              }`}
            >
              Detect Relations
            </span>
          </button>
          
          <button 
            onClick={clearRelations}
            className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground py-2 rounded-md flex items-center transition-all duration-300"
            style={{
              paddingLeft: isExpanded ? '1rem' : '0',
              paddingRight: isExpanded ? '1rem' : '0',
              justifyContent: isExpanded ? 'flex-start' : 'center'
            }}
          >
            <div className="flex justify-center w-10 h-5 items-center">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <span 
              className={`transition-all duration-300 whitespace-nowrap ${
                isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'
              }`}
            >
              Clear Relations
            </span>
          </button>

          { /* Remove All Tables Button */ }
          <button 
            onClick={removeAllTables}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md flex items-center transition-all duration-300"
            style={{
              paddingLeft: isExpanded ? '1rem' : '0',
              paddingRight: isExpanded ? '1rem' : '0',
              justifyContent: isExpanded ? 'flex-start' : 'center'
            }}
          >
            <div className="flex justify-center w-10 h-5 items-center">
              <Trash className="h-5 w-5" />
            </div>
            <span 
              className={`transition-all duration-300 whitespace-nowrap ${
                isExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'
              }`}
            >
              Remove All Tables
            </span>
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden mt-4">
          {(tables.length > 0 ) && (
            <div>
              <h3 className="font-semibold text-sidebar-foreground/70 mb-2 text-center">
                {isExpanded ? `Tables (${tables.length})` : `(${tables.length})`}
              </h3>
              
              <div className={`space-y-2 ${isExpanded && "overflow-y-auto"} max-h-64`}>
                {tables.map((table) => (
                  <div 
                    key={table.id} 
                    onClick={() => onTableSelect(table.id)}
                    className={`cursor-pointer bg-sidebar-accent/20 hover:bg-sidebar-accent/30 rounded-md text-sm transition-all ${
                      isExpanded ? 'p-3' : 'p-2'
                    }`}
                  >
                    <div className="font-medium flex items-center justify-center">
                      <div className="flex justify-center w-5 h-5 items-center">
                        <TableIcon size={14} className="text-accent" />
                      </div>
                      <span 
                        className={`transition-opacity duration-300 whitespace-nowrap ${
                          isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                        }`}
                      >
                        {table.name}
                      </span>
                    </div>
                    
                    <div 
                      className={`text-xs text-sidebar-foreground/60 mt-1 transition-all duration-300 whitespace-nowrap ${
                        isExpanded ? 'opacity-100 w-full h-max' : 'opacity-0 w-0 mt-0 h-0'
                      }`}
                    >
                      {table.columns.length} column{table.columns.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-4">
          <div className={isExpanded ? '' : 'flex flex-col items-center'}>
            <h3 
              className={`font-semibold text-sidebar-foreground/70 mb-2 px-2 text-center whitespace-nowrap ${
                isExpanded ? 'opacity-100' : 'opacity-0 w-0'
              }`}
            >
              Relation Types
            </h3>
            
            <div className={`space-y-2 text-xs ${isExpanded ? '' : 'space-y-3'}`}>
              <div className={`flex items-center transition-all ${
                isExpanded ? 'bg-sidebar-accent/20 p-2 rounded-md' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-green-500 "></div>
                <span 
                  className={`text-sidebar-foreground/80 ml-2 transition-opacity duration-300 whitespace-nowrap ${
                    isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                  }`}
                >
                  One-to-One
                </span>
              </div>      
              <div className={`flex items-center transition-all ${
                isExpanded ? 'bg-sidebar-accent/20 p-2 rounded-md' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-blue-500 "></div>
                <span 
                  className={`text-sidebar-foreground/80 ml-2 transition-opacity duration-300 whitespace-nowrap ${
                    isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                  }`}
                >
                  One-to-Many
                </span>
              </div>      
              <div className={`flex items-center transition-all ${
                isExpanded ? 'bg-sidebar-accent/20 p-2 rounded-md' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-purple-500 "></div>
                <span 
                  className={`text-sidebar-foreground/80 ml-2 transition-opacity duration-300 whitespace-nowrap ${
                    isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                  }`}
                >
                  Many-to-Many
                </span>
              </div>
            </div>
          </div>
          
          {/* Wrap ThemeSwitcher in a container to control the keepExpanded state */}
          <div 
            className="mt-4 flex justify-start"
            onMouseEnter={() => setKeepExpanded(true)}
            onMouseLeave={() => setKeepExpanded(false)}
          >
            <ThemeSwitcher stopPropagation={isExpanded} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
