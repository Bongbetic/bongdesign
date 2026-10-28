import React from 'react';
import { Breadcrumb, BreadcrumbItem, ClickableTile, ListItem, UnorderedList } from '@carbon/react';
import { RouteLink, navClick } from '../routes.jsx';

// Guidance module (T08): patterns, data-visualization and support/MCP pages.
// All copy below is original Bongbetic guidance distilled from the tracked
// upstream Carbon source (carbon-src/, Apache-2.0, (c) IBM) -- never copied
// from IBM's website. Building blocks name components pinned in
// data/components.json and link to their live pages.

export const PATTERNS = [
  {
    slug: 'empty-state',
    title: 'Empty state',
    intro:
      'An empty state tells the user why there is nothing to see yet and what to do next. Every empty state pairs a short explanation with one primary action.',
    when: [
      'A list, table, or search returns zero results.',
      'A first-run product area has no user data yet.',
    ],
    blocks: ['Tile', 'Button', 'Link'],
    done: ['Explain why the view is empty in one sentence.', 'Offer a single primary action that fills it.'],
  },
  {
    slug: 'search-and-filter',
    title: 'Search and filter',
    intro:
      'Search narrows a large set to what the user asked for; filters narrow it to a facet. Keep the query visible so results stay explainable.',
    when: ['Browsing more items than fit on one screen.', 'Combining free text with structured facets.'],
    blocks: ['Search', 'ComboBox', 'DataTable', 'Tag'],
    done: ['Show the active query and removable filter tags.', 'Announce result counts for assistive technology.'],
  },
  {
    slug: 'form-validation',
    title: 'Form validation',
    intro:
      'Validate inline, next to the field that needs attention, and confirm success at the point of submit. Never clear what the user already typed.',
    when: ['Collecting structured input across one or more fields.', 'Rejecting input the server cannot accept.'],
    blocks: ['TextInput', 'TextArea', 'Button', 'Notification'],
    done: ['Put the error message beside the field, not only on top.', 'Keep valid entries when one field fails.'],
  },
  {
    slug: 'confirmation-dialogs',
    title: 'Confirmation dialogs',
    intro:
      'Confirm only destructive or hard-to-undo actions. Name the consequence in the dialog heading so the choice is skimmable.',
    when: ['Deleting, discarding, or overwriting user work.', 'Triggering an irreversible side effect.'],
    blocks: ['Modal', 'Button'],
    done: ['State the consequence in the heading.', 'Label buttons with the action, never just OK.'],
  },
  {
    slug: 'notifications-and-feedback',
    title: 'Notifications and feedback',
    intro:
      'Feedback confirms the system heard the user. Transient messages suit background events; persistent panels suit anything the user must act on.',
    when: ['Confirming a completed background action.', 'Surfacing errors that need user attention.'],
    blocks: ['Notification', 'NotificationsPanel', 'Tag'],
    done: ['Match persistence to importance: toast for FYI, panel for action.', 'Write the next step, not just the error.'],
  },
  {
    slug: 'onboarding',
    title: 'Onboarding',
    intro:
      'Onboarding earns its steps: teach in context, let returning users skip, and end with the user doing real work -- not reading about it.',
    when: ['First-run setup that unlocks core value.', 'Complex flows that need progressive disclosure.'],
    blocks: ['Tearsheet', 'SidePanel', 'Breadcrumb', 'Tabs', 'Button'],
    done: ['Keep steps skippable and resumable.', 'End on a real task, not a congratulations screen.'],
  },
  {
    slug: 'common-actions',
    title: 'Common actions',
    intro:
      'Every screen offers a small set of things the user can do. Order actions by importance: one primary button, secondary buttons beside it, and the rest behind an overflow menu.',
    when: ['A page or row exposes several commands at once.', 'Space forces a choice between visible and overflow actions.'],
    blocks: ['Button', 'OverflowMenu', 'Link'],
    done: ['Give each view exactly one primary action.', 'Move destructive or rare actions into the overflow menu.'],
  },
  {
    slug: 'dialogs',
    title: 'Dialogs',
    intro:
      'A dialog interrupts the flow for a decision the user must make now. Keep it short, focus it on open, and always offer a visible way out.',
    when: ['Confirming a choice before it takes effect.', 'Collecting a small amount of input without leaving the page.'],
    blocks: ['Modal', 'Button', 'TextInput'],
    done: ['Focus the dialog when it opens and return focus on close.', 'Offer Cancel alongside any confirm button.'],
  },
  {
    slug: 'disabled-states',
    title: 'Disabled states',
    intro:
      'Disable a control only when the user cannot act yet, and say what unlocks it. A permanently greyed-out button teaches users to stop looking.',
    when: ['An action needs input the user has not provided yet.', 'A permission the user lacks gates the control.'],
    blocks: ['Button', 'TextInput', 'Toggle'],
    done: ['Explain next to the control what enables it.', 'Prefer hiding actions the user can never take.'],
  },
  {
    slug: 'disclosures',
    title: 'Disclosures',
    intro:
      'Disclosures hide detail until the user asks for it, keeping long pages scannable. The heading alone must make sense without opening the section.',
    when: ['Advanced settings most users never change.', 'Long reference content read top to bottom.'],
    blocks: ['Accordion', 'Button', 'Tag'],
    done: ['Write headings that stand alone when collapsed.', 'Remember open state across visits for task flows.'],
  },
  {
    slug: 'filtering',
    title: 'Filtering',
    intro:
      'Filters narrow a set by facets the user picks. Show every active filter as a removable tag so the current result set is always explainable.',
    when: ['Browsing a catalogue with known facets like status or type.', 'Combining several independent constraints.'],
    blocks: ['ComboBox', 'MultiSelect', 'DataTable', 'Tag'],
    done: ['Render each active filter as a removable tag.', 'Update result counts as filters change.'],
  },
  {
    slug: 'fluid-styles',
    title: 'Fluid styles',
    intro:
      'Fluid forms stretch inputs to the container so dense admin screens stay aligned. Use them for data-heavy forms, not for simple one-question flows.',
    when: ['Building dense configuration or settings forms.', 'Aligning many inputs on a shared grid.'],
    blocks: ['FluidForm', 'TextInput', 'Grid'],
    done: ['Reserve fluid layout for genuinely dense forms.', 'Keep labels visible at every breakpoint.'],
  },
  {
    slug: 'global-header',
    title: 'Global header',
    intro:
      'The header is the product frame: identity on the left, navigation and search in the middle, user and settings on the right. It never scrolls away.',
    when: ['Framing every page of a multi-area product.', 'Offering global search and account controls.'],
    blocks: ['UIShell', 'Breadcrumb', 'Search'],
    done: ['Keep the same header on every page.', 'Put product identity left, user controls right.'],
  },
  {
    slug: 'loading',
    title: 'Loading',
    intro:
      'Loading states hold attention while data arrives. Skeletons preview the coming layout for content; spinners suit short waits; progress bars suit long ones with a known end.',
    when: ['Waiting on data before first paint.', 'Running an operation that takes seconds.'],
    blocks: ['Loading', 'SkeletonText', 'ProgressBar'],
    done: ['Prefer skeletons that preview the layout over bare spinners.', 'State what is loading, not just that something is.'],
  },
  {
    slug: 'login',
    title: 'Login',
    intro:
      'Login is a gate, not a showcase: one credential form, one error style, and a clear path for locked-out users. Brand it lightly and get out of the way.',
    when: ['Gating a product behind authentication.', 'Recovering a failed or expired session.'],
    blocks: ['TextInput', 'PasswordInput', 'Button', 'Tile'],
    done: ['Show one error style for bad credentials.', 'Link account recovery next to the submit button.'],
  },
  {
    slug: 'notifications',
    title: 'Notifications',
    intro:
      'Notifications report what happened while the user was elsewhere. Toasts confirm background events; a notification panel keeps anything the user must act on.',
    when: ['Confirming a background save or export.', 'Alerting the user to something needing action.'],
    blocks: ['Notification', 'NotificationsPanel', 'Tag'],
    done: ['Match persistence to importance: toast for FYI, panel for action.', 'Timestamp every notification.'],
  },
  {
    slug: 'overflow-content',
    title: 'Overflow content',
    intro:
      'Content longer than its container needs a deliberate overflow: truncate with a tooltip for single lines, scroll regions for lists, and tabs when sections compete.',
    when: ['Long names or values inside fixed-width cells.', 'More sections than fit above the fold.'],
    blocks: ['OverflowMenu', 'Tooltip', 'Tabs'],
    done: ['Never clip text without a way to reveal it.', 'Prefer tabs over nested scroll regions.'],
  },
  {
    slug: 'read-only-states',
    title: 'Read-only states',
    intro:
      'Read-only views show values without inviting edits: plain structured text, not disabled inputs. Disabled controls imply an action that read-only never offers.',
    when: ['Reviewing submitted or approved data.', 'Showing users values their role cannot change.'],
    blocks: ['StructuredList', 'Tile', 'Tag'],
    done: ['Render values as text, not disabled inputs.', 'Offer an explicit edit path where permission allows.'],
  },
  {
    slug: 'search',
    title: 'Search',
    intro:
      'Search accepts free text and returns ranked results fast. Keep the query visible, suggest as the user types, and always handle zero results gracefully.',
    when: ['Finding one item in a large set by name or keyword.', 'Jumping to a destination without navigating.'],
    blocks: ['Search', 'ExpandableSearch', 'DataTable'],
    done: ['Keep the query visible above the results.', 'Design the zero-results state, not just the hits.'],
  },
  {
    slug: 'status-indicators',
    title: 'Status indicators',
    intro:
      'Status indicators turn system state into a glance: a tag for the current state, a progress bar for ongoing work, a spinner only for brief waits.',
    when: ['Showing health, phase, or outcome of an object.', 'Tracking a long-running operation.'],
    blocks: ['Tag', 'ProgressBar', 'Loading'],
    done: ['Pair every color with a text label.', 'Use one indicator style per state, everywhere.'],
  },
  {
    slug: 'text-toolbar',
    title: 'Text toolbar',
    intro:
      'A text toolbar puts rich-text formatting beside the field it formats. Offer only the formats the product supports, in the order writers reach for them.',
    when: ['Editing formatted text, comments, or notes.', 'Applying a small fixed set of inline styles.'],
    blocks: ['Button', 'OverflowMenu', 'Tooltip'],
    done: ['Limit buttons to formats the product actually renders.', 'Show the active format for the current selection.'],
  },
];

// Data-visualization topics distilled from the reference crawl: one entry per
// topic page. Blocks name pinned components where the topic has a direct
// building block; conceptual topics carry no blocks.
export const DV_TOPICS = [
  {
    topic: 'overview',
    title: 'Overview',
    intro:
      'Data visualization turns numbers into decisions. Start from the question the user needs answered, pick the simplest chart that answers it, and always offer the underlying data as text.',
    blocks: ['DataTable', 'Tile'],
    done: ['Name the user question before choosing a chart.', 'Pair every chart with its data table.'],
  },
  {
    topic: 'simple-charts',
    title: 'Simple charts',
    intro:
      'Bars, lines, and pies cover most product needs. Bars compare, lines show change over time, and pies show a part of a whole with very few slices.',
    blocks: ['DataTable', 'Tile', 'Tag'],
    done: ['Start bars at zero so lengths stay honest.', 'Prefer bars over pie beyond three slices.'],
  },
  {
    topic: 'flow-charts',
    title: 'Flow charts',
    intro:
      'Flow charts show how something moves through steps or states. Keep the direction consistent, label every branch, and never let lines cross without meaning.',
    blocks: ['Tile', 'Tag'],
    done: ['Flow in one direction on the page.', 'Label every decision branch.'],
  },
  {
    topic: 'spatial-charts',
    title: 'Spatial charts',
    intro:
      'Spatial charts place data on maps or layouts where location is the point. Provide a text equivalent for every region, because color on a map is never enough alone.',
    blocks: ['Tile', 'DataTable'],
    done: ['Offer a text equivalent for every mapped region.', 'Never encode the only signal in color.'],
  },
  {
    topic: 'gantt-charts',
    title: 'Gantt charts',
    intro:
      'Gantt charts plan work across time: one row per item, bars for duration, markers for milestones. Keep dependencies visible but few.',
    blocks: ['DataTable', 'Tile', 'ProgressBar'],
    done: ['One row per item, bars for duration.', 'Mark milestones so slips are visible early.'],
  },
  {
    topic: 'dashboards',
    title: 'Dashboards',
    intro:
      'A dashboard answers one operational question at a glance. Put the headline number first, group supporting charts by question, and let every tile link to its detail.',
    blocks: ['Tile', 'DataTable', 'ProgressBar'],
    done: ['Lead with the headline number.', 'Let every tile link through to its detail view.'],
  },
  {
    topic: 'chart-anatomy',
    title: 'Chart anatomy',
    intro:
      'Every chart has the same parts: title, axes, series, legend, and source. Label each part deliberately so the chart survives being screenshotted out of context.',
    blocks: ['Tile'],
    done: ['Title every chart as a statement of what it shows.', 'Cite the data source on the chart itself.'],
  },
  {
    topic: 'axes-and-labels',
    title: 'Axes and labels',
    intro:
      'Axes and labels are where charts go wrong: truncated ranges exaggerate, missing units confuse, and rotated labels go unread. Label directly wherever the chart allows it.',
    blocks: ['DataTable'],
    done: ['Start quantitative axes at zero unless there is a stated reason.', 'Put units on the axis, not in the title.'],
  },
  {
    topic: 'legends',
    title: 'Legends',
    intro:
      'A legend maps series to meaning. Prefer direct labels on the series; when a legend is unavoidable, keep it beside the chart and in the same order as the data.',
    blocks: ['Tag'],
    done: ['Prefer direct series labels over a legend.', 'Order legend entries to match the chart.'],
  },
  {
    topic: 'color-palettes',
    title: 'Color palettes',
    intro:
      'Chart palettes encode series, thresholds, and emphasis -- never the only signal. Use the pinned Carbon palettes so charts inherit theme and accessibility work.',
    blocks: [],
    done: ['Use the pinned palettes, never ad-hoc hex.', 'Check every palette for color-vision safety.'],
  },
];

// Getting-started pages: the adoption path for a team picking up BongDesign,
// from first principles to contributing back.
export const GS_PAGES = [
  {
    page: 'about',
    title: 'About BongDesign',
    intro:
      'BongDesign is Bongbetic\u2019s self-hosted design system, pinned to Carbon v1.119.0 and served from this host. It carries the full component set, foundations, patterns, and an MCP endpoint for agent tooling.',
    blocks: ['Tile', 'Button'],
    done: ['Know the pinned Carbon version before planning upgrades.', 'Treat this host as the only source of truth for components.'],
  },
  {
    page: 'designing',
    title: 'Designing',
    intro:
      'Design with the same tokens the code ships: the foundations section pins every color, type, spacing, and motion value. Start from a pattern page so the screen you draw already has approved building blocks.',
    blocks: ['Tile', 'Grid'],
    done: ['Pull values from foundations, never eyeball them.', 'Start each screen from a pattern, not a blank canvas.'],
  },
  {
    page: 'developing',
    title: 'Developing',
    intro:
      'Build with the pinned @carbon/react release: every component page shows live props, and the MCP endpoint answers component and token questions for agents. Develop against this host, not upstream.',
    blocks: ['Button', 'TextInput'],
    done: ['Develop against the pinned release on this host.', 'Check the component page for props before inventing variants.'],
  },
  {
    page: 'mcp-setup',
    title: 'MCP setup',
    intro:
      'Point a harness at this host\u2019s /mcp endpoint with a Bearer [REDACTED] to give agents component, token, icon, and branding answers. The Connect the MCP page holds the config shape.',
    blocks: [],
    done: ['Keep the credential on your own machine, never in docs.', 'Probe with ping before wiring tools.'],
  },
  {
    page: 'contributing',
    title: 'Contributing',
    intro:
      'Changes land through one ticket branch, test-first, with PR review -- the same workflow that built this site. Propose new patterns with their building blocks and done criteria.',
    blocks: [],
    done: ['Open one ticket branch per change.', 'Add the failing test before the implementation.'],
  },
  {
    page: 'migrating',
    title: 'Migrating',
    intro:
      'Upgrades are manual and deliberate: bump the pinned Carbon version, rebuild the index from carbon-src, and run the full gate suite before shipping. Skipped versions get their own ticket.',
    blocks: [],
    done: ['Bump the pin and rebuild from carbon-src together.', 'Run every gate before shipping an upgrade.'],
  },
];

// Building-experiences steps: the journey from first contact with BongDesign
// to a shipped product and beyond, in reference order.
export const BX_STEPS = [
  {
    step: 'overview',
    title: 'Overview',
    intro:
      'Building with BongDesign runs discover, learn, try, buy, onboard, use, expand -- from first contact to a shipped product -- with help at every step.',
    blocks: [],
    done: ['Enter at the step that matches your situation.', 'Move forward when the exit criteria read true.'],
  },
  {
    step: 'discover',
    title: 'Discover',
    intro:
      'Discover what BongDesign covers: the component index, the foundations, and the patterns. If the set matches your product\u2019s needs, keep going.',
    blocks: ['Tile', 'Button'],
    done: ['Confirm your product\u2019s needs exist in the index.', 'Note gaps before committing.'],
  },
  {
    step: 'learn',
    title: 'Learn',
    intro:
      'Learn the system\u2019s ideas: tokens before components, patterns before screens. The foundations and getting-started pages are the curriculum.',
    blocks: [],
    done: ['Read foundations before building screens.', 'Complete one pattern end to end.'],
  },
  {
    step: 'try',
    title: 'Try',
    intro:
      'Try the system on a real screen: copy a pattern\u2019s building blocks, wire the pinned components, and check the result against the done list.',
    blocks: ['Button', 'TextInput', 'Tile'],
    done: ['Build one real screen, not a sandbox.', 'Score it against the pattern\u2019s done list.'],
  },
  {
    step: 'buy',
    title: 'Buy',
    intro:
      'Buy is the adoption decision: confirm hosting, auth, and the MCP endpoint meet your team\u2019s bar, then bless BongDesign as the default for new work.',
    blocks: [],
    done: ['Confirm auth and hosting meet your bar.', 'Declare BongDesign the default for new screens.'],
  },
  {
    step: 'onboard',
    title: 'Onboard',
    intro:
      'Onboard the team: point designers at foundations, developers at component pages, and agents at the MCP endpoint. One shared vocabulary from day one.',
    blocks: [],
    done: ['Give every role its entry page.', 'Connect the team\u2019s harness to /mcp.'],
  },
  {
    step: 'use',
    title: 'Use',
    intro:
      'Use the system daily: patterns for screens, tokens for values, components for behavior. File gaps as tickets instead of forking around them.',
    blocks: ['DataTable', 'Modal'],
    done: ['Reach for a pattern before inventing.', 'File gaps as tickets, never silent forks.'],
  },
  {
    step: 'expand',
    title: 'Expand',
    intro:
      'Expand coverage as products grow: new patterns graduate from repeated screens, and new components arrive with pinned releases.',
    blocks: [],
    done: ['Graduate patterns from repeated screens.', 'Adopt new components at pinned upgrades.'],
  },
  {
    step: 'end-use',
    title: 'End use',
    intro:
      'End use is the shipped product in users\u2019 hands: keep the system current so fixes flow downstream, and watch support questions for missing guidance.',
    blocks: [],
    done: ['Stay within one pin of the latest release.', 'Turn repeat questions into guidance.'],
  },
  {
    step: 'get-help',
    title: 'Get help',
    intro:
      'Get help when stuck: the support page lists FAQs, contact paths, and the originality statement. Bring the page URL and what you expected.',
    blocks: [],
    done: ['Check the FAQs first.', 'Report with the page URL and expected behavior.'],
  },
];

// Support FAQs plus contact and originality sections extend the support page
// to cover the reference support area: FAQs, contact, certificate.
export const SUPPORT_FAQS = [
  {
    q: 'Which Carbon version is pinned?',
    a: 'BongDesign pins Carbon v1.119.0. The pin is manual: upgrades arrive as their own ticket, never silently.',
  },
  {
    q: 'How do I connect an agent to the MCP endpoint?',
    a: 'POST JSON-RPC to /mcp on this host with a Bearer [REDACTED] The Connect the MCP page shows the config shape with a placeholder, never a real secret.',
  },
  {
    q: 'Why do I see a login wall?',
    a: 'The design system sits behind authentication: only signed-in users can browse components, guidance, and the MCP docs.',
  },
  {
    q: 'Where do I report a missing component or pattern?',
    a: 'File a ticket against the bongdesign repo with the page URL and what you expected. Gaps are fixed test-first on a branch with PR review.',
  },
  {
    q: 'Can I copy guidance text into my product docs?',
    a: 'Yes. All guidance prose on this host is original Bongbetic writing; the certificate of originality below states the position plainly.',
  },
];

// Tool catalogue mirrors server.py TOOLS by construction: the render-check
// parses server.py and requires every one of these names on the MCP page,
// so adding a server tool without documenting it here fails the suite.
export const MCP_TOOLS = [
  { name: 'server_info', description: 'BongDesign server identity, pinned Carbon version and counts.' },
  { name: 'list_components', description: 'List all indexed components, optional substring filter.' },
  { name: 'get_component', description: 'Details, docs URL and React example for one component.' },
  { name: 'search_components', description: 'Substring search over component names.' },
  { name: 'lookup_token', description: 'Look up a Carbon design token (color, layout, motion, type, theme) by name; pinned values.' },
  { name: 'search_icons', description: 'Substring search over pinned Carbon icon names.' },
  { name: 'search_pictograms', description: 'Substring search over pinned Carbon pictogram names.' },
  { name: 'get_branding', description: 'Bongbetic brand summary: accent colour and vendored local assets.' },
];

export const MCP_PLACEHOLDER = 'YOUR_BONGDESIGN_TOKEN';

const MCP_SNIPPET =
  '{\n' +
  '  "mcpServers": {\n' +
  '    "bongdesign": {\n' +
  '      "type": "streamable-http",\n' +
  '      "url": "https://design.bongbetic.com/mcp",\n' +
  '      "headers": {\n' +
  '        "Authorization": "Bearer ' +
  MCP_PLACEHOLDER +
  '"\n' +
  '      }\n' +
  '    }\n' +
  '  }\n' +
  '}';

function Attribution() {
  return <p style={{ marginTop: '2rem' }}>Guidance distilled from the tracked upstream Carbon source (carbon-src, Apache-2.0, (c) IBM).</p>;
}

function BlockLinks({ names }) {
  return (
    <UnorderedList>
      {names.map((n) => (
        <ListItem key={n}>
          <RouteLink to={'/components/' + n.toLowerCase()}>{n}</RouteLink>
        </ListItem>
      ))}
    </UnorderedList>
  );
}

// Patterns index: one card per pattern, each opening its guidance page.
export function PatternsIndex() {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Patterns</BreadcrumbItem>
      </Breadcrumb>
      <h1>Patterns</h1>
      <p>Core patterns for common product moments, built from the pinned component set.</p>
      <div className="bong-card-grid">
        {PATTERNS.map((p) => {
          const to = '/patterns/' + p.slug;
          return (
            <ClickableTile key={p.slug} href={to} onClick={navClick(to)}>
              <h3>{p.title}</h3>
              <p>{p.intro}</p>
            </ClickableTile>
          );
        })}
      </div>
      <Attribution />
    </div>
  );
}

// One pattern per URL, driven by the PATTERNS table above.
export function PatternPage({ name }) {
  const pattern = PATTERNS.find((p) => p.slug === String(name || '').toLowerCase());
  if (!pattern) {
    return (
      <div>
        <h1>Pattern not found</h1>
        <p>
          No pattern named &ldquo;{name}&rdquo;. Back to the <RouteLink to="/patterns">patterns index</RouteLink>.
        </p>
      </div>
    );
  }
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <RouteLink to="/patterns">Patterns</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{pattern.title}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{pattern.title}</h1>
      <p>{pattern.intro}</p>
      <div className="bong-section">
        <h2>When to use it</h2>
        <UnorderedList>
          {pattern.when.map((w, i) => (
            <ListItem key={i}>{w}</ListItem>
          ))}
        </UnorderedList>
      </div>
      <div className="bong-section">
        <h2>Building blocks</h2>
        <BlockLinks names={pattern.blocks} />
      </div>
      <div className="bong-section">
        <h2>Do this</h2>
        <UnorderedList>
          {pattern.done.map((d, i) => (
            <ListItem key={i}>{d}</ListItem>
          ))}
        </UnorderedList>
      </div>
      <Attribution />
    </div>
  );
}

// Data-visualization guidance: chart choice, dashboard layout, and the
// accessible building blocks pinned in this repo.
export function DataVisualizationPage() {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Data visualization</BreadcrumbItem>
      </Breadcrumb>
      <h1>Data visualization</h1>
      <p>
        Pick the simplest chart that answers the user&rsquo;s question, lay dashboards out on the Carbon grid, and always
        offer the data as text. Charts pair with the pinned building blocks below.
      </p>
      <div className="bong-section">
        <h2>Choosing a chart</h2>
        <UnorderedList>
          <ListItem>Trend over time -- line or bar; never pie for change.</ListItem>
          <ListItem>Part of a whole -- stacked bar first, donut only for few slices.</ListItem>
          <ListItem>Comparison -- grouped bars with a shared baseline at zero.</ListItem>
        </UnorderedList>
      </div>
      <div className="bong-section">
        <h2>Accessible by default</h2>
        <UnorderedList>
          <ListItem>Never encode meaning with color alone -- add labels or patterns.</ListItem>
          <ListItem>Pair every chart with its data table so screen readers get the numbers.</ListItem>
          <ListItem>Keep animation subtle and honour reduced-motion preferences.</ListItem>
        </UnorderedList>
      </div>
      <div className="bong-section">
        <h2>Building blocks</h2>
        <BlockLinks names={['DataTable', 'Tile', 'ProgressBar', 'Tag']} />
      </div>
      <div className="bong-section">
        <h2>Topics</h2>
        <div className="bong-card-grid">
          {DV_TOPICS.map((t) => {
            const to = '/data-visualization/' + t.topic;
            return (
              <ClickableTile key={t.topic} href={to} onClick={navClick(to)}>
                <h3>{t.title}</h3>
                <p>{t.intro}</p>
              </ClickableTile>
            );
          })}
        </div>
      </div>
      <Attribution />
    </div>
  );
}

// Shared renderer for guide entries (data-viz topics, getting-started pages,
// experience steps): breadcrumb, intro, optional when/blocks, done checklist.
function GuideArticle({ crumb, indexTo, entry, keyName }) {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <RouteLink to={indexTo}>{crumb}</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{entry.title}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{entry.title}</h1>
      <p>{entry.intro}</p>
      {entry.when && entry.when.length > 0 && (
        <div className="bong-section">
          <h2>When to use it</h2>
          <UnorderedList>
            {entry.when.map((w, i) => (
              <ListItem key={i}>{w}</ListItem>
            ))}
          </UnorderedList>
        </div>
      )}
      {entry.blocks && entry.blocks.length > 0 && (
        <div className="bong-section">
          <h2>Building blocks</h2>
          <BlockLinks names={entry.blocks} />
        </div>
      )}
      <div className="bong-section">
        <h2>Do this</h2>
        <UnorderedList>
          {entry.done.map((d, i) => (
            <ListItem key={i}>{d}</ListItem>
          ))}
        </UnorderedList>
      </div>
      <Attribution />
    </div>
  );
}

function GuideIndex({ crumb, entries, keyName, base }) {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{crumb}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{crumb}</h1>
      <div className="bong-card-grid">
        {entries.map((e) => {
          const to = base + '/' + e[keyName];
          return (
            <ClickableTile key={e[keyName]} href={to} onClick={navClick(to)}>
              <h3>{e.title}</h3>
              <p>{e.intro}</p>
            </ClickableTile>
          );
        })}
      </div>
      <Attribution />
    </div>
  );
}

function GuideNotFound({ label, indexTo, indexLabel, value }) {
  return (
    <div>
      <h1>{label} not found</h1>
      <p>
        No {label.toLowerCase()} named &ldquo;{value}&rdquo;. Back to the{' '}
        <RouteLink to={indexTo}>{indexLabel}</RouteLink>.
      </p>
    </div>
  );
}

// Data-visualization topic page, driven by DV_TOPICS.
export function DataVizTopicPage({ topic }) {
  const entry = DV_TOPICS.find((t) => t.topic === String(topic || '').toLowerCase());
  if (!entry) {
    return <GuideNotFound label="Topic" indexTo="/data-visualization" indexLabel="data visualization" value={topic} />;
  }
  return <GuideArticle crumb="Data visualization" indexTo="/data-visualization" entry={entry} />;
}

// Getting-started index and page, driven by GS_PAGES.
export function GettingStartedIndex() {
  return <GuideIndex crumb="Getting started" entries={GS_PAGES} keyName="page" base="/getting-started" />;
}

export function GettingStartedPage({ page }) {
  const entry = GS_PAGES.find((g) => g.page === String(page || '').toLowerCase());
  if (!entry) {
    return <GuideNotFound label="Guide" indexTo="/getting-started" indexLabel="getting started" value={page} />;
  }
  return <GuideArticle crumb="Getting started" indexTo="/getting-started" entry={entry} />;
}

// Building-experiences index and step page, driven by BX_STEPS.
export function ExperiencesIndex() {
  return <GuideIndex crumb="Building experiences" entries={BX_STEPS} keyName="step" base="/building-experiences" />;
}

export function ExperiencePage({ step }) {
  const entry = BX_STEPS.find((b) => b.step === String(step || '').toLowerCase());
  if (!entry) {
    return (
      <GuideNotFound label="Step" indexTo="/building-experiences" indexLabel="building experiences" value={step} />
    );
  }
  return <GuideArticle crumb="Building experiences" indexTo="/building-experiences" entry={entry} />;
}

// Support section index: FAQs, contact, originality, and tooling links.
export function SupportPage() {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Support</BreadcrumbItem>
      </Breadcrumb>
      <h1>Support</h1>
      <p>Help for building with BongDesign and for connecting agent tooling.</p>
      <div className="bong-section">
        <h2>Frequently asked questions</h2>
        <UnorderedList>
          {SUPPORT_FAQS.map((f) => (
            <ListItem key={f.q}>
              <strong>{f.q}</strong> {f.a}
            </ListItem>
          ))}
        </UnorderedList>
      </div>
      <div className="bong-section">
        <h2>Contact</h2>
        <p>
          Report gaps with the page URL and what you expected via a ticket against the bongdesign repository. Include
          the route you were on and the pinned Carbon version shown on the About page.
        </p>
      </div>
      <div className="bong-section">
        <h2>Certificate of originality</h2>
        <p>
          All guidance prose on this host is original Bongbetic writing distilled from the tracked upstream Carbon
          source (carbon-src, Apache-2.0, (c) IBM). No website copy was reproduced: component behavior comes from
          pinned code, and every explanation here was written fresh for BongDesign.
        </p>
      </div>
      <div className="bong-card-grid">
        <ClickableTile href="/mcp" onClick={navClick('/mcp')}>
          <h3>Connect the MCP</h3>
          <p>Point a harness at this host&rsquo;s MCP endpoint with a placeholder-token config.</p>
        </ClickableTile>
        <ClickableTile href="/components" onClick={navClick('/components')}>
          <h3>Component index</h3>
          <p>Every pinned component with live demos and props.</p>
        </ClickableTile>
        <ClickableTile href="/foundations/color" onClick={navClick('/foundations/color')}>
          <h3>Foundations</h3>
          <p>Tokens, type, icons, and motion from the pinned release.</p>
        </ClickableTile>
      </div>
    </div>
  );
}

// MCP page: teaches a harness user to connect. The config carries the
// YOUR_BONGDESIGN_TOKEN placeholder only -- a real credential lives on the
// user's own machine and is never shared through docs, chat, or tickets.
export function McpPage() {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <RouteLink to="/support">Support</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Connect the MCP</BreadcrumbItem>
      </Breadcrumb>
      <h1>Connect the MCP</h1>
      <p>
        BongDesign serves a Streamable-HTTP MCP endpoint at <code>/mcp</code> on this host. Send JSON-RPC{' '}
        <code>POST</code> requests with a Bearer credential issued for this server (the <code>BONGDESIGN_TOKEN</code>{' '}
        value). A <code>GET</code> to <code>/mcp</code> answers 405 -- use <code>POST</code>.
      </p>
      <div className="bong-section">
        <h2>Client config</h2>
        <p>Copy this shape and replace the host and the placeholder on your own machine:</p>
        <pre style={{ overflowX: 'auto', background: '#f4f4f4', padding: '1rem' }}>
          <code>{MCP_SNIPPET}</code>
        </pre>
        <p>
          Keep {MCP_PLACEHOLDER} as a placeholder until you substitute your own credential locally. Never share a real
          credential in chat, tickets, screenshots, or docs.
        </p>
      </div>
      <div className="bong-section">
        <h2>Calls the server answers</h2>
        <UnorderedList>
          <ListItem>
            <code>initialize</code> -- handshake, returns protocol version and server identity.
          </ListItem>
          <ListItem>
            <code>ping</code> -- health probe for the endpoint.
          </ListItem>
          <ListItem>
            <code>tools/list</code> -- the tool catalogue below.
          </ListItem>
          <ListItem>
            <code>tools/call</code> -- run one tool by name with arguments.
          </ListItem>
        </UnorderedList>
      </div>
      <div className="bong-section">
        <h2>Tools</h2>
        <UnorderedList>
          {MCP_TOOLS.map((t) => (
            <ListItem key={t.name}>
              <code>{t.name}</code> -- {t.description}
            </ListItem>
          ))}
        </UnorderedList>
      </div>
    </div>
  );
}
