import React from 'react';
import { Breadcrumb, BreadcrumbItem, ClickableTile } from '@carbon/react';
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
    <ul>
      {names.map((n) => (
        <li key={n}>
          <RouteLink to={'/components/' + n.toLowerCase()}>{n}</RouteLink>
        </li>
      ))}
    </ul>
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
        <ul>
          {pattern.when.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
      <div className="bong-section">
        <h2>Building blocks</h2>
        <BlockLinks names={pattern.blocks} />
      </div>
      <div className="bong-section">
        <h2>Do this</h2>
        <ul>
          {pattern.done.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
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
        <ul>
          <li>Trend over time -- line or bar; never pie for change.</li>
          <li>Part of a whole -- stacked bar first, donut only for few slices.</li>
          <li>Comparison -- grouped bars with a shared baseline at zero.</li>
        </ul>
      </div>
      <div className="bong-section">
        <h2>Accessible by default</h2>
        <ul>
          <li>Never encode meaning with color alone -- add labels or patterns.</li>
          <li>Pair every chart with its data table so screen readers get the numbers.</li>
          <li>Keep animation subtle and honour reduced-motion preferences.</li>
        </ul>
      </div>
      <div className="bong-section">
        <h2>Building blocks</h2>
        <BlockLinks names={['DataTable', 'Tile', 'ProgressBar', 'Tag']} />
      </div>
      <Attribution />
    </div>
  );
}

// Support section index: where to get help and how to connect tooling.
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
        <ul>
          <li>
            <code>initialize</code> -- handshake, returns protocol version and server identity.
          </li>
          <li>
            <code>ping</code> -- health probe for the endpoint.
          </li>
          <li>
            <code>tools/list</code> -- the tool catalogue below.
          </li>
          <li>
            <code>tools/call</code> -- run one tool by name with arguments.
          </li>
        </ul>
      </div>
      <div className="bong-section">
        <h2>Tools</h2>
        <ul>
          {MCP_TOOLS.map((t) => (
            <li key={t.name}>
              <code>{t.name}</code> -- {t.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
