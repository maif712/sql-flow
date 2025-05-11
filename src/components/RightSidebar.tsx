
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download, Code } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Table } from '../types/schema';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeProvider';


type RightSidebarProps = {
  tables: Table[];
  generateSqlScript: () => string;
  updateTablesFromSql?: (sql: string) => void;
};

const RightSidebar = ({ tables, generateSqlScript, updateTablesFromSql }: RightSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sqlScript, setSqlScript] = useState<string>('');
  const editorRef = useRef<any>(null);
  const { isDark } = useTheme();

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }
  
  // Generate SQL when tables change
  useEffect(() => {
    const script = generateSqlScript();
    setSqlScript(script);
  }, [tables, generateSqlScript]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    toast.success('SQL copied to clipboard!');
  };
  
  const handleDownload = () => {
    const blob = new Blob([sqlScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SQL file downloaded!');
  };

  const handleSqlChange = (value: string | undefined) => {
    const script = value || '';
    setSqlScript(script);
  };

  const handleApplySql = () => {
    if (updateTablesFromSql && sqlScript) {
      try {
        updateTablesFromSql(sqlScript);
      } catch (error) {
        toast.error("SQL error: " + String(error));
      }
    }
  };
  
  return (
    <div className={`transition-all duration-300 bg-card text-card-foreground flex h-full border-l border-border ${isCollapsed ? 'w-12' : 'w-96'}`}>
      <div 
        className="cursor-pointer border-r border-border flex items-center justify-center px-2"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </div>
      
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-auto flex flex-col h-full">
          <div className="flex items-center mb-4">
            <Code className="h-5 w-5 text-accent mr-2" />
            <h2 className="text-xl font-bold">Schema Code</h2>
          </div>

          <div className="flex space-x-2 mb-4">
            <button 
              onClick={handleApplySql}
              className="flex-1 bg-primary cursor-pointer hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md"
              disabled={!sqlScript}
            >
              Apply SQL
            </button>
            <button 
              onClick={handleCopyToClipboard}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground p-2 rounded-md"
              title="Copy to clipboard"
              disabled={!sqlScript}
            >
              <Copy size={18} />
            </button>
            <button 
              onClick={handleDownload}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground p-2 rounded-md"
              title="Download SQL"
              disabled={!sqlScript}
            >
              <Download size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-muted rounded-md flex-grow relative">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={sqlScript}
              onChange={handleSqlChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16 },
              }}
              theme={isDark ? "vs-dark" : "light"}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
