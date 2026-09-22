import { BrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import { ModeProvider } from "./modes";
import { CommandPaletteProvider } from "./providers";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary label="app">
        <ModeProvider>
          <CommandPaletteProvider>
            <Layout />
          </CommandPaletteProvider>
        </ModeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}