import React, { useMemo } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  DataTable,
  Link,
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
} from '@carbon/react';
import Explorer, { DemoBoundary, componentCards } from '../explorer.jsx';
import { RouteLink } from '../routes.jsx';
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

// Gallery route: the full explorer, unchanged, mounted inside the shell.
export function ComponentsOverview() {
  return (
    <div>
      <h1>All components</h1>
      <p>
        Every component in the pinned upstream release, rendered live from
        your own repo.
      </p>
      <Explorer />
    </div>
  );
}

// One component-page template, driven by data/*.json: live demo, guidance
// tabs, and the mined props table.
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
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/components">Components</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{card.name}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{card.name}</h1>
      {card.live ? (
        <DemoBoundary>
          <div className="bong-demo-row">{card.demo}</div>
        </DemoBoundary>
      ) : (
        <p>{card.note || 'Live render needs extra props — see code below.'}</p>
      )}
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
              <ul>
                {g.guidelines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
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
            <pre style={{ overflowX: 'auto', background: '#f4f4f4', padding: '1rem' }}>
              <code>{card.code}</code>
            </pre>
          </TabPanel>
          <TabPanel>
            {g ? (
              <ul>
                {g.a11y.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>Accessibility notes for this entry are being written.</p>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <div className="bong-section">
        <h2>Props</h2>
        <PropsTable name={card.name} />
      </div>
      <div className="bong-section">
        <h2>All components</h2>
        <div className="bong-index">
          {others.map((c) => (
            <div key={c.name}>
              <RouteLink to={`/components/${c.name.toLowerCase()}`}>{c.name}</RouteLink>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '1rem' }}>
          Pinned to upstream Carbon {index.meta.carbonTag} ·{' '}
          <Link href="https://github.com/Bongbetic/bongdesign">Bongbetic/bongdesign</Link>
        </p>
      </div>
    </div>
  );
}
