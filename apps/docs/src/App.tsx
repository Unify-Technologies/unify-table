import "@unify/table-react/displays";
import "@unify/table-react/styles";
import "@unify/table-react/themes";
import "highlight.js/styles/github-dark-dimmed.css";

import { Router, Route } from "./router";
import { DuckDBProvider, useDB } from "./providers/DuckDBProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Shell } from "./layout/Shell";

import Home from "./pages/Home";
import GettingStarted from "./pages/GettingStarted";
import HowItWorks from "./pages/HowItWorks";
import TableBasics from "./pages/TableBasics";
import ColumnDefinitions from "./pages/ColumnDefinitions";
import DensityLayout from "./pages/DensityLayout";
import Themes from "./pages/Themes";
import PluginOverview from "./pages/PluginOverview";
import Presets from "./pages/Presets";
import Panels from "./pages/Panels";
import DisplayOverview from "./pages/DisplayOverview";
import SqlBuilder from "./pages/SqlBuilder";
import FilterSystem from "./pages/FilterSystem";
import QueryEngine from "./pages/QueryEngine";
import Charts from "./pages/Charts";
import Headless from "./pages/Headless";
import Demo from "./pages/Demo";

// Plugin pages
import FiltersPlugin from "./pages/plugin/Filters";
import SelectionPlugin from "./pages/plugin/Selection";
import EditingPlugin from "./pages/plugin/Editing";
import KeyboardPlugin from "./pages/plugin/Keyboard";
import ClipboardPlugin from "./pages/plugin/Clipboard";
import ColumnResizePlugin from "./pages/plugin/ColumnResize";
import ColumnPinPlugin from "./pages/plugin/ColumnPin";
import ColumnReorderPlugin from "./pages/plugin/ColumnReorder";
import ContextMenuPlugin from "./pages/plugin/ContextMenu";
import ViewsPlugin from "./pages/plugin/Views";
import TableIOPlugin from "./pages/plugin/TableIO";
import FindReplacePlugin from "./pages/plugin/FindReplace";
import FormulasPlugin from "./pages/plugin/Formulas";
import RowGroupingPlugin from "./pages/plugin/RowGrouping";
import FormattingPlugin from "./pages/plugin/Formatting";
import StatusBarPlugin from "./pages/plugin/StatusBar";

// Display pages
import ChartDisplay from "./pages/display/Chart";
import StatsDisplay from "./pages/display/Stats";
import PivotDisplay from "./pages/display/Pivot";
import SummaryDisplay from "./pages/display/Summary";
import CorrelationDisplay from "./pages/display/Correlation";
import TimelineDisplay from "./pages/display/Timeline";
import OutliersDisplay from "./pages/display/Outliers";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark-surface)]">
      <div className="text-center space-y-6">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 border-2 border-[var(--color-dark-border)] rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-[var(--color-dark-accent)] rounded-full animate-spin" />
        </div>
        <p className="text-[var(--color-dark-text)] font-medium tracking-wide text-sm">
          INITIALIZING
        </p>
        <p className="text-[var(--color-dark-text-muted)] text-xs font-mono">
          Loading DuckDB-WASM engine...
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark-surface)]">
      <div className="max-w-lg p-8 border border-[var(--color-negative)]/30 rounded-xl">
        <p className="text-[var(--color-negative)] font-semibold mb-2">
          Initialization failed
        </p>
        <pre className="text-xs font-mono text-[var(--color-dark-text-secondary)] whitespace-pre-wrap">
          {message}
        </pre>
      </div>
    </div>
  );
}

function AppContent() {
  const { db, error } = useDB();

  if (error) return <ErrorScreen message={error} />;
  if (!db) return <LoadingScreen />;

  return (
    <Shell>
      <Route path="/" component={Home} />
      <Route path="/getting-started" component={GettingStarted} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/table-basics" component={TableBasics} />
      <Route path="/column-definitions" component={ColumnDefinitions} />
      <Route path="/density-layout" component={DensityLayout} />
      <Route path="/themes" component={Themes} />
      <Route path="/plugins" component={PluginOverview} />
      <Route path="/plugins/filters" component={FiltersPlugin} />
      <Route path="/plugins/selection" component={SelectionPlugin} />
      <Route path="/plugins/editing" component={EditingPlugin} />
      <Route path="/plugins/keyboard" component={KeyboardPlugin} />
      <Route path="/plugins/clipboard" component={ClipboardPlugin} />
      <Route path="/plugins/column-resize" component={ColumnResizePlugin} />
      <Route path="/plugins/column-pin" component={ColumnPinPlugin} />
      <Route path="/plugins/column-reorder" component={ColumnReorderPlugin} />
      <Route path="/plugins/context-menu" component={ContextMenuPlugin} />
      <Route path="/plugins/views" component={ViewsPlugin} />
      <Route path="/plugins/table-io" component={TableIOPlugin} />
      <Route path="/plugins/find-replace" component={FindReplacePlugin} />
      <Route path="/plugins/formulas" component={FormulasPlugin} />
      <Route path="/plugins/row-grouping" component={RowGroupingPlugin} />
      <Route path="/plugins/formatting" component={FormattingPlugin} />
      <Route path="/plugins/status-bar" component={StatusBarPlugin} />
      <Route path="/presets" component={Presets} />
      <Route path="/panels" component={Panels} />
      <Route path="/displays" component={DisplayOverview} />
      <Route path="/displays/chart" component={ChartDisplay} />
      <Route path="/displays/stats" component={StatsDisplay} />
      <Route path="/displays/pivot" component={PivotDisplay} />
      <Route path="/displays/summary" component={SummaryDisplay} />
      <Route path="/displays/correlation" component={CorrelationDisplay} />
      <Route path="/displays/timeline" component={TimelineDisplay} />
      <Route path="/displays/outliers" component={OutliersDisplay} />
      <Route path="/sql-builder" component={SqlBuilder} />
      <Route path="/filter-system" component={FilterSystem} />
      <Route path="/query-engine" component={QueryEngine} />
      <Route path="/charts" component={Charts} />
      <Route path="/headless" component={Headless} />
      <Route path="/demo" component={Demo} />
    </Shell>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <DuckDBProvider>
        <Router>
          <AppContent />
        </Router>
      </DuckDBProvider>
    </ThemeProvider>
  );
}
