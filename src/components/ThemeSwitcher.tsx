import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

import { useTheme } from '@/context/ThemeProvider';

type ThemeSwitcherProps = {
  stopPropagation?: boolean;
};

export function ThemeSwitcher({ stopPropagation = false }: ThemeSwitcherProps) {
  const { mode, setMode, isLight } = useTheme();

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  const handleThemeSelection = (
    e: React.MouseEvent,
    newMode: 'light' | 'dark' | 'system'
  ) => {
    e.preventDefault();
    if (stopPropagation) {
      e.stopPropagation();
    }
    setMode(newMode);
  };

  // Utility to add active classes for selected theme with proper text colors.
  const getItemClasses = (itemMode: 'light' | 'dark' | 'system') =>
    `cursor-pointer ${mode === itemMode ? 'bg-gray-200 dark:bg-gray-700' : ''}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-transparent hover:bg-sidebar-accent text-sidebar-foreground"
          onClick={handleButtonClick}
        >
          {isLight ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}>
        <DropdownMenuItem onClick={(e) => handleThemeSelection(e, 'light')} className={getItemClasses('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleThemeSelection(e, 'dark')} className={getItemClasses('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleThemeSelection(e, 'system')} className={getItemClasses('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
