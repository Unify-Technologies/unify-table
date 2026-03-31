import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { Example } from "../components/Example";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function DensityLayout() {
  return (
    <div>
      <PageTitle>Density & Layout</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Control row height and table sizing.
      </p>

      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        Density controls the vertical rhythm of the table — row height, cell padding, and font
        size all scale together. Choose a density based on how your users interact with the data:
        <code>compact</code> fits more rows on screen for scanning and comparison, <code>comfortable</code> is
        a balanced default for general use, and <code>spacious</code> gives breathing room for
        tables where readability matters more than density.
      </p>

      <Heading level={2} id="density">Row Density</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Three density options control row height: <code>compact</code> (28px), <code>comfortable</code> (36px, default), <code>spacious</code> (48px).
      </p>
      <Example id="density-comparison" title="Toggle Density" description="Compact shows more rows, spacious improves readability. Click to compare all three modes." height={380} />

      <Heading level={2} id="height">Height</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Set a fixed height with a number (pixels) or CSS string. Virtual scrolling is enabled
        automatically via TanStack Virtual. If no height is specified, the table will fill its
        parent container.
      </p>

      <Heading level={2} id="virtual-scroll">Virtual Scrolling</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The table uses TanStack Virtual for efficient rendering. Only visible rows are in the DOM,
        so even 1M+ rows scroll smoothly. The virtualizer calculates which rows are in view based
        on scroll position and row height, renders only those rows, and recycles DOM nodes as you scroll.
      </p>
      <Callout type="info" title="Performance">
        Virtual scrolling means the table only renders visible rows regardless of dataset size.
        A table with 1 million rows uses the same memory as one with 100 — the DOM footprint
        stays constant. Combined with DuckDB handling all sorting and filtering in SQL, the
        browser never needs to hold the full dataset in JavaScript memory.
      </Callout>

      <PageNav />
    </div>
  );
}
