import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useThemeMode } from "@/hooks/use-theme-mode";

const queryClient = new QueryClient();

// Component to apply theme-specific styles to Sonner toasts
const ThemedToasts = () => {
  const { mode } = useThemeMode();

  return (
    <Sonner
      position="bottom-right"
      theme={mode === 'system' ? 'system' : mode}
      richColors
      closeButton

    />
  );
};

const App = () => (
    <QueryClientProvider client={queryClient}>

      <TooltipProvider>
        <ThemedToasts />
        <BrowserRouter basename="/sql-flow"> {/* Add basename */}
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>

);

export default App;
