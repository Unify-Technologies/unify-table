import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { Example } from "../components/Example";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function Themes() {
  return (
    <div>
      <PageTitle>Themes</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Built-in dark and light themes with full CSS customization.
      </p>

      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        Unify Table ships with built-in dark and light themes, both available as pure CSS — no
        Tailwind required. Themes provide three things: style class names for table slots (header,
        row, cell), CSS variable overrides for panel components (filters, columns panel, etc.),
        and a container class for scoping the theme boundary. Import theme CSS through the
        package sub-paths:
      </p>
      <CodeBlock code={`import '@unify/table-react/styles';    // panel CSS
import '@unify/table-react/themes';    // theme class definitions
import '@unify/table-react/displays';  // display renderer CSS
import { darkTheme, lightTheme } from '@unify/table-react';`} language="tsx" />

      <Heading level={2} id="built-in">Built-in Themes</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Two themes are provided out of the box: <code>darkTheme</code> and <code>lightTheme</code>.
        Pass either to the <code>Table</code> component via the <code>styles</code> prop, or
        spread the theme object to apply all three parts at once.
      </p>
      <Example id="theme-toggle" title="Theme Toggle" description="Toggle between dark and light themes. Both ship as pure CSS with no Tailwind dependency." height={380} />

      <Heading level={2} id="theme-interface">Theme Interface</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Every theme implements the <code>Theme</code> interface. The three fields correspond to
        different layers of the table UI:
      </p>
      <CodeBlock code={`interface Theme {
  styles: TableStyles;              // CSS class names for table slots
  panelVars: Record<string, string>; // CSS custom properties for panels
  containerClass: string;           // Outer container class
}`} language="tsx" />
      <ul className="text-[13px] mb-4 list-disc pl-5 space-y-2" style={{ color: "var(--doc-text-secondary)" }}>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>styles</strong> — class names applied to the
          table header, rows, even rows, cells, and other structural elements. Use these to control
          backgrounds, borders, and hover states.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>panelVars</strong> — CSS custom properties
          injected as inline styles on the table container. Panel components (filter panel, columns
          panel, context menus) read these variables for their colors. This is the primary
          customization mechanism for non-table UI.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>containerClass</strong> — a class applied to
          the outermost wrapper, useful for scoping borders, rounded corners, or shadows.
        </li>
      </ul>

      <Heading level={2} id="css-variables">CSS Variables</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Panel UI components use these CSS custom properties. Override them
        in <code>panelVars</code> to change colors without writing any CSS files:
      </p>
      <CodeBlock code={`--utbl-color-surface        // Background
--utbl-color-surface-alt    // Alternate background
--utbl-color-border         // Border color
--utbl-color-text           // Primary text
--utbl-color-text-secondary // Secondary text
--utbl-color-text-muted     // Muted text
--utbl-color-accent         // Accent / primary color
--utbl-color-input-bg       // Input background
--utbl-color-input-border   // Input border`} language="css" />
      <Callout type="tip" title="CSS variables are the primary customization mechanism">
        Rather than overriding individual class names, start by changing CSS variables
        in <code>panelVars</code>. This ensures consistent theming across all panel components —
        filters, column pickers, context menus, and display renderers all read from the same
        variable set.
      </Callout>

      <Heading level={2} id="custom-theme">Creating a Custom Theme</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        To create a custom theme, define an object matching the <code>Theme</code> interface. You
        can start from scratch or spread one of the built-in themes and override specific fields.
        The example below creates an indigo-themed dark table:
      </p>
      <CodeBlock code={`const customTheme: Theme = {
  styles: {
    header: 'bg-indigo-900 text-white',
    row: 'hover:bg-indigo-950/20',
    rowEven: 'bg-indigo-950/10',
    cell: 'border-b border-indigo-800/30',
  },
  panelVars: {
    '--utbl-color-surface': '#1e1b4b',
    '--utbl-color-accent': '#818cf8',
  },
  containerClass: 'rounded-lg border border-indigo-800',
};`} language="tsx" />

      <PageNav />
    </div>
  );
}
