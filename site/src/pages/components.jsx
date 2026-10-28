import React, { useMemo, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ClickableTile,
  DataTable,
  Dropdown,
  Link,
  ListItem,
  Search,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Tag,
  Theme,
  UnorderedList,
} from '@carbon/react';
import { DemoBoundary, category, componentCards } from '../explorer.jsx';
import { RouteLink, navClick } from '../routes.jsx';
import guidelines from '../../../data/guidelines.json';
import propsIndex from '../../../data/props.json';
import index from '../../../data/components.json';

function guideFor(name, entry) {
  if (entry && entry.doc && guidelines[entry.doc]) return guidelines[entry.doc];
  if (guidelines[name]) return guidelines[name];
  return null;
}

const PROP_HEADERS = [
  { key: 'name', header: 'Prop' },
  { key: 'type', header: 'Type' },
  { key: 'required', header: 'Required' },
  { key: 'description', header: 'Description' },
];

function PropsTable({ name }) {
  const entry = propsIndex.components && propsIndex.components[name];
  const rows = (entry && entry.props ? entry.props : []).map((p, i) => ({
    id: String(i),
    name: p.name,
    type: p.type,
    required: p.required ? 'Yes' : 'No',
    description: p.description,
  }));
  if (rows.length === 0) return <p>No documented props in the pinned release.</p>;
  return (
    <DataTable rows={rows} headers={PROP_HEADERS}>
      {({ rows: r, headers: h, getTableProps, getHeaderProps, getRowProps }) => (
        <Table {...getTableProps()}>
          <TableHead>
            <TableRow>
              {h.map((header) => (
                <TableHeader key={header.key} {...getHeaderProps({ header })}>
                  {header.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {r.map((row) => (
              <TableRow key={row.id} {...getRowProps({ row })}>
                {row.cells.map((cell) => (
                  <TableCell key={cell.id}>{cell.value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTable>
  );
}

// Gallery route: searchable card grid over the explorer index. Every card
// deep-links to its per-component page; the filter narrows by name. The
// live demos themselves (explorer.jsx) render on the component pages.
export function ComponentsOverview() {
  const { cards } = useMemo(componentCards, []);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = cards.filter((c) => c.name.toLowerCase().includes(q));
  return (
    <div>
      <h1>All components</h1>
      <p>
        Every component in the pinned upstream release, rendered live from
        your own repo.
      </p>
      <Search
        id="components-filter"
        labelText="Filter components"
        placeholder="e.g. modal"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p>
        Showing {shown.length} of {cards.length} components.
      </p>
      <div className="bong-card-grid">
        {shown.map((c) => {
          const to = `/components/${c.name.toLowerCase()}`;
          return (
            <ClickableTile key={c.name} href={to} onClick={navClick(to)}>
              <h3>{c.name}</h3>
              <p>
                {category(c.name)} · {c.live ? 'Live demo' : c.note || 'Code only'}
              </p>
            </ClickableTile>
          );
        })}
      </div>
    </div>
  );
}

// Button page mirrors the locked prototype screen
// (carbon/.heimdall/design/prototype/component-button.html): breadcrumb,
// title, one-primary-button intro, Guidelines / Specifications / Code /
// Accessibility tabs, Primary / Secondary / Tertiary demo, usage snippet,
// and the real props table from the pinned source.
const BUTTON_INTRO =
  'Buttons communicate actions users can take. Each page should have only one primary button.';
const BUTTON_CODE = `import { Button } from '@carbon/react';

<Button kind="primary">Save</Button>`;
const BUTTON_PROPS_NOTE =
  'Real props table (kind, size, disabled, renderIcon\u2026) served from the pinned source.';

function ButtonDemo() {
  return (
    <>
      <Button>Primary</Button> <Button kind="secondary">Secondary</Button>{' '}
      <Button kind="tertiary">Tertiary</Button>
    </>
  );
}

function introFor(card, g) {
  if (g && g.guidelines && g.guidelines.length > 0) return g.guidelines[0];
  return `${card.name} ships in the pinned upstream release \u2014 rendered live from your own repo.`;
}

// Per-page index navigation: the old 147-link plain footer index (178
// anchors per page) is a Carbon StructuredList with three rows — previous
// sibling, the full component index, next sibling — so every pinned
// component stays reachable without the raw anchor wall.
function ComponentIndexNav({ card, others }) {
  const idx = others.findIndex((c) => c.name === card.name);
  const prev = others[(idx - 1 + others.length) % others.length];
  const next = others[(idx + 1) % others.length];
  const rows = [
    { label: 'Previous', target: prev },
    { label: 'Next', target: next },
  ];
  return (
    <StructuredListWrapper>
      <StructuredListBody>
        <StructuredListRow>
          <StructuredListCell>Full index</StructuredListCell>
          <StructuredListCell>
            <RouteLink to="/components">All {others.length} components</RouteLink>
          </StructuredListCell>
        </StructuredListRow>
        {rows.map((r) => (
          <StructuredListRow key={r.label}>
            <StructuredListCell>{r.label}</StructuredListCell>
            <StructuredListCell>
              <RouteLink to={`/components/${r.target.name.toLowerCase()}`}>{r.target.name}</RouteLink>
            </StructuredListCell>
          </StructuredListRow>
        ))}
      </StructuredListBody>
    </StructuredListWrapper>
  );
}

// One component-page template, driven by data/*.json: live demo, guidance
// tabs, and the mined props table. Utilities that cannot render alone get
// an honest code-only state instead of a broken demo.
export function ComponentPage({ name }) {
  const { cards, byName } = useMemo(componentCards, []);
  const card = cards.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
  const others = useMemo(
    () => [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  if (!card) {
    return (
      <div>
        <h1>Component not found</h1>
        <p>
          No component named “{name}” in the pinned release. Back to the{' '}
          <RouteLink to="/components">component index</RouteLink>.
        </p>
      </div>
    );
  }
  const g = guideFor(card.name, byName[card.name]);
  const isButton = card.name === 'Button';
  const code = isButton ? BUTTON_CODE : card.code;
  const [theme, setTheme] = useState('white');
  const demo = isButton ? (
    <DemoBoundary>
      <div className="bong-demo-row bong-demo">
        <ButtonDemo />
      </div>
    </DemoBoundary>
  ) : card.live ? (
    <DemoBoundary key={`${card.name}-${theme}`}>
      <Theme theme={theme}>
        <div className="bong-demo-row bong-demo" style={{ padding: '1rem' }}>
          {card.demo}
        </div>
      </Theme>
    </DemoBoundary>
  ) : (
    <p>{card.note || 'Live render needs extra props — see code below.'}</p>
  );
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/components">Components</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{card.name}</BreadcrumbItem>
      </Breadcrumb>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ flex: '1', minWidth: 0 }}>
          <h1>{card.name}</h1>
          <p>
            <Tag type="blue">Stable</Tag>{' '}
            <span>Self-hosted snapshot {index.meta.carbonTag}</span>
          </p>
          <p>{isButton ? BUTTON_INTRO : introFor(card, g)}</p>
          <h2>Live demo</h2>
          {(isButton || card.live) && (
            <>
              <Dropdown
                id={`theme-${card.name}`}
                titleText="Theme"
                label="Theme"
                items={['white', 'g10', 'g90', 'g100']}
                selectedItem={theme}
                onChange={({ selectedItem }) => setTheme(selectedItem || 'white')}
              />
              <div style={{ marginTop: '1rem' }}>{demo}</div>
              <p>
                This live demo shows the pinned component with the pinned
                tokens. Full variant coverage lives in the vendored stories
                under <code>carbon-src/react</code>.
              </p>
            </>
          )}
          {!(isButton || card.live) && demo}
      <Tabs>
        <TabList>
          <Tab>Guidelines</Tab>
          <Tab>Specifications</Tab>
          <Tab>Code</Tab>
          <Tab>Accessibility</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {g ? (
              <UnorderedList>
                {g.guidelines.map((line, i) => (
                  <ListItem key={i}>{line}</ListItem>
                ))}
              </UnorderedList>
            ) : (
              <p>Guidance for this entry is being written.</p>
            )}
          </TabPanel>
          <TabPanel>
            {g ? (
              <div>
                <p>
                  <strong>Variants:</strong> {g.specs.variants}
                </p>
                <p>
                  <strong>Sizes:</strong> {g.specs.sizes}
                </p>
                <p>
                  <strong>Notes:</strong> {g.specs.notes}
                </p>
              </div>
            ) : (
              <p>Specifications for this entry are being written.</p>
            )}
          </TabPanel>
          <TabPanel>
            <pre className="bong-code">
              <code>{code}</code>
            </pre>
          </TabPanel>
          <TabPanel>
            {g ? (
              <UnorderedList>
                {g.a11y.map((line, i) => (
                  <ListItem key={i}>{line}</ListItem>
                ))}
              </UnorderedList>
            ) : (
              <p>Accessibility notes for this entry are being written.</p>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <div className="bong-section">
        <h2>Props</h2>
        {isButton && <p>{BUTTON_PROPS_NOTE}</p>}
        <PropsTable name={card.name} />
      </div>
      <div className="bong-section">
        <h2>All components</h2>
        <p>
          Every pinned component stays one click away through the{' '}
          <RouteLink to="/components">component index</RouteLink>. Previous
          and next walk the alphabetical set.
        </p>
        <ComponentIndexNav card={card} others={others} />
        <p style={{ marginTop: '1rem' }}>
          Pinned to upstream Carbon {index.meta.carbonTag} ·{' '}
          <Link href="https://github.com/Bongbetic/bongdesign">Bongbetic/bongdesign</Link>
        </p>
      </div>
        </div>
        <aside style={{ flex: '0 0 12rem' }}>
          <strong>BongDesign Core</strong>
          <Dropdown
            id={`framework-${card.name}`}
            titleText="Framework"
            label="Framework"
            items={['React']}
            selectedItem="React"
            onChange={() => {}}
          />
          <p style={{ marginTop: '1rem' }}>
            <Link href="https://github.com/Bongbetic/bongdesign">Repo</Link>
          </p>
          <p>
            <RouteLink to="/mcp">MCP</RouteLink>
          </p>
        </aside>
      </div>
    </div>
  );
}
