import BasicTable from "./basic_table";
import basicTableCode from "./basic_table.tsx?raw";
import WithFilters from "./with_filters";
import withFiltersCode from "./with_filters.tsx?raw";
import WithSelection from "./with_selection";
import withSelectionCode from "./with_selection.tsx?raw";
import WithEditing from "./with_editing";
import withEditingCode from "./with_editing.tsx?raw";
import WithGrouping from "./with_grouping";
import withGroupingCode from "./with_grouping.tsx?raw";
import WithFormatting from "./with_formatting";
import withFormattingCode from "./with_formatting.tsx?raw";
import WithClipboard from "./with_clipboard";
import withClipboardCode from "./with_clipboard.tsx?raw";
import WithColumnResize from "./with_column_resize";
import withColumnResizeCode from "./with_column_resize.tsx?raw";
import WithColumnPin from "./with_column_pin";
import withColumnPinCode from "./with_column_pin.tsx?raw";
import WithColumnReorder from "./with_column_reorder";
import withColumnReorderCode from "./with_column_reorder.tsx?raw";
import WithContextMenu from "./with_context_menu";
import withContextMenuCode from "./with_context_menu.tsx?raw";
import WithStatusBar from "./with_status_bar";
import withStatusBarCode from "./with_status_bar.tsx?raw";
import PresetSpreadsheet from "./preset_spreadsheet";
import presetSpreadsheetCode from "./preset_spreadsheet.tsx?raw";
import PresetDataViewer from "./preset_data_viewer";
import presetDataViewerCode from "./preset_data_viewer.tsx?raw";
import PresetReadOnly from "./preset_read_only";
import presetReadOnlyCode from "./preset_read_only.tsx?raw";
import DensityComparison from "./density_comparison";
import densityComparisonCode from "./density_comparison.tsx?raw";
import ThemeToggle from "./theme_toggle";
import themeToggleCode from "./theme_toggle.tsx?raw";
import DisplayChart from "./display_chart";
import displayChartCode from "./display_chart.tsx?raw";
import DisplayStats from "./display_stats";
import displayStatsCode from "./display_stats.tsx?raw";
import DisplayPivot from "./display_pivot";
import displayPivotCode from "./display_pivot.tsx?raw";
import DisplaySummary from "./display_summary";
import displaySummaryCode from "./display_summary.tsx?raw";
import DisplayCorrelation from "./display_correlation";
import displayCorrelationCode from "./display_correlation.tsx?raw";
import DisplayTimeline from "./display_timeline";
import displayTimelineCode from "./display_timeline.tsx?raw";
import DisplayOutliers from "./display_outliers";
import displayOutliersCode from "./display_outliers.tsx?raw";
import WithFindReplace from "./with_find_replace";
import withFindReplaceCode from "./with_find_replace.tsx?raw";
import WithFormulas from "./with_formulas";
import withFormulasCode from "./with_formulas.tsx?raw";
import WithTableIO from "./with_table_io";
import withTableIOCode from "./with_table_io.tsx?raw";
import WithPanels from "./with_panels";
import withPanelsCode from "./with_panels.tsx?raw";
import WithCharts from "./with_charts";
import withChartsCode from "./with_charts.tsx?raw";
import FilterSystemExample from "./filter_system";
import filterSystemCode from "./filter_system.tsx?raw";
import SqlBuilderExample from "./sql_builder";
import sqlBuilderCode from "./sql_builder.tsx?raw";
import QueryEngineExample from "./query_engine";
import queryEngineCode from "./query_engine.tsx?raw";

interface ExampleDef {
  component: React.ComponentType<{ db: any }>;
  code: string;
  seedSql?: string;
}

export const EXAMPLES: Record<string, ExampleDef> = {
  "basic-table": { component: BasicTable, code: basicTableCode },
  "with-filters": { component: WithFilters, code: withFiltersCode },
  "with-selection": { component: WithSelection, code: withSelectionCode },
  "with-editing": { component: WithEditing, code: withEditingCode },
  "with-grouping": { component: WithGrouping, code: withGroupingCode },
  "with-formatting": { component: WithFormatting, code: withFormattingCode },
  "with-clipboard": { component: WithClipboard, code: withClipboardCode },
  "with-column-resize": { component: WithColumnResize, code: withColumnResizeCode },
  "with-column-pin": { component: WithColumnPin, code: withColumnPinCode },
  "with-column-reorder": { component: WithColumnReorder, code: withColumnReorderCode },
  "with-context-menu": { component: WithContextMenu, code: withContextMenuCode },
  "with-status-bar": { component: WithStatusBar, code: withStatusBarCode },
  "preset-spreadsheet": { component: PresetSpreadsheet, code: presetSpreadsheetCode },
  "preset-data-viewer": { component: PresetDataViewer, code: presetDataViewerCode },
  "preset-read-only": { component: PresetReadOnly, code: presetReadOnlyCode },
  "density-comparison": { component: DensityComparison, code: densityComparisonCode },
  "theme-toggle": { component: ThemeToggle, code: themeToggleCode },
  "display-chart": { component: DisplayChart, code: displayChartCode },
  "display-stats": { component: DisplayStats, code: displayStatsCode },
  "display-pivot": { component: DisplayPivot, code: displayPivotCode },
  "display-summary": { component: DisplaySummary, code: displaySummaryCode },
  "display-correlation": { component: DisplayCorrelation, code: displayCorrelationCode },
  "display-timeline": { component: DisplayTimeline, code: displayTimelineCode },
  "display-outliers": { component: DisplayOutliers, code: displayOutliersCode },
  "with-find-replace": { component: WithFindReplace, code: withFindReplaceCode },
  "with-formulas": { component: WithFormulas, code: withFormulasCode },
  "with-table-io": { component: WithTableIO, code: withTableIOCode },
  "with-panels": { component: WithPanels, code: withPanelsCode },
  "with-charts": { component: WithCharts, code: withChartsCode },
  "filter-system": { component: FilterSystemExample, code: filterSystemCode },
  "sql-builder": { component: SqlBuilderExample, code: sqlBuilderCode },
  "query-engine": { component: QueryEngineExample, code: queryEngineCode },
};
