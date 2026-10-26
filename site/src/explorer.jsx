import React, { useMemo, useState } from 'react';
import * as Carbon from '@carbon/react';
import { Link } from '@carbon/react';
import index from '../../data/components.json';

export class DemoBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <p>Live render needs extra props — see code below.</p>;
    }
    return this.props.children;
  }
}

export function category(name) {
  const n = name.toLowerCase();
  if (/fluid|form|textinput|password|textarea|numberinput|select|dropdown|combo|multiselect|search|checkbox|radio|toggle|slider|datepicker|timepicker|fileuploader/.test(n))
    return 'Forms';
  if (/breadcrumb|^tab|pagination|menu|header|sidenav|switcher|skipto|link|contentswitcher|uishell/.test(n))
    return 'Navigation';
  if (/table|structured|tree|contained|tag|badge|progress|loading|skeleton|listbox|list/.test(n))
    return 'Data display';
  if (/modal|notification|toast|tooltip|toggletip|popover|dialog/.test(n)) return 'Feedback';
  if (/button|copy/.test(n)) return 'Buttons';
  if (/grid|layer|layout|stack|aspect|tile|accordion/.test(n)) return 'Layout';
  if (/ailabel|aiskeleton|chat|slug/.test(n)) return 'AI';
  return 'Content';
}

const ITEMS = [
  { id: 'a', text: 'Alpha' },
  { id: 'b', text: 'Beta' },
];

function DemoModal() {
  const [open, setOpen] = useState(false);
  const { Modal, Button } = Carbon;
  return (
    <>
      <Button kind="tertiary" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        modalHeading="BongDesign modal"
        primaryButtonText="Done"
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => setOpen(false)}
      >
        <p>Renders from the self-hosted bundle.</p>
      </Modal>
    </>
  );
}

const CURATED = {
  Breadcrumb: {
    demo: (
      <Carbon.Breadcrumb>
        <Carbon.BreadcrumbItem>
          <Link href="#branding">Home</Link>
        </Carbon.BreadcrumbItem>
        <Carbon.BreadcrumbItem isCurrentPage>Gallery</Carbon.BreadcrumbItem>
      </Carbon.Breadcrumb>
    ),
  },
  Accordion: {
    demo: (
      <Carbon.Accordion>
        <Carbon.AccordionItem title="First">
          <p>Body one.</p>
        </Carbon.AccordionItem>
        <Carbon.AccordionItem title="Second">
          <p>Body two.</p>
        </Carbon.AccordionItem>
      </Carbon.Accordion>
    ),
  },
  Tabs: {
    demo: (
      <Carbon.Tabs>
        <Carbon.TabList>
          <Carbon.Tab>One</Carbon.Tab>
          <Carbon.Tab>Two</Carbon.Tab>
        </Carbon.TabList>
        <Carbon.TabPanels>
          <Carbon.TabPanel>Panel one.</Carbon.TabPanel>
          <Carbon.TabPanel>Panel two.</Carbon.TabPanel>
        </Carbon.TabPanels>
      </Carbon.Tabs>
    ),
  },
  DataTable: {
    demo: (
      <Carbon.DataTable
        rows={[{ id: '1', name: 'Accordion' }, { id: '2', name: 'Button' }]}
        headers={[{ key: 'name', header: 'Component' }]}
      >
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Carbon.Table {...getTableProps()}>
            <Carbon.TableHead>
              <Carbon.TableRow>
                {headers.map((header) => (
                  <Carbon.TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </Carbon.TableHeader>
                ))}
              </Carbon.TableRow>
            </Carbon.TableHead>
            <Carbon.TableBody>
              {rows.map((row) => (
                <Carbon.TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <Carbon.TableCell key={cell.id}>{cell.value}</Carbon.TableCell>
                  ))}
                </Carbon.TableRow>
              ))}
            </Carbon.TableBody>
          </Carbon.Table>
        )}
      </Carbon.DataTable>
    ),
  },
  Dropdown: {
    demo: (
      <Carbon.Dropdown
        id="x-drop"
        titleText="Pick"
        label="Choose"
        items={ITEMS}
        itemToString={(i) => (i ? i.text : '')}
      />
    ),
  },
  ComboBox: {
    demo: (
      <Carbon.ComboBox
        id="x-combo"
        titleText="Pick"
        placeholder="Type to filter"
        items={ITEMS}
        itemToString={(i) => (i ? i.text : '')}
      />
    ),
  },
  MultiSelect: {
    demo: (
      <Carbon.MultiSelect
        id="x-multi"
        titleText="Pick"
        label="Choose several"
        items={ITEMS}
        itemToString={(i) => (i ? i.text : '')}
      />
    ),
  },
  Select: {
    demo: (
      <Carbon.Select id="x-select" labelText="Select">
        <Carbon.SelectItem value="a" text="Option A" />
        <Carbon.SelectItem value="b" text="Option B" />
      </Carbon.Select>
    ),
  },
  RadioButtonGroup: {
    demo: (
      <Carbon.RadioButtonGroup legendText="Group" name="x-radio" defaultSelected="r1">
        <Carbon.RadioButton id="xr1" labelText="One" value="r1" />
        <Carbon.RadioButton id="xr2" labelText="Two" value="r2" />
      </Carbon.RadioButtonGroup>
    ),
  },
  Modal: { demo: <DemoModal /> },
  MenuButton: {
    demo: (
      <Carbon.MenuButton label="Actions">
        <Carbon.MenuItem label="One" />
        <Carbon.MenuItem label="Two" />
      </Carbon.MenuButton>
    ),
  },
  OverflowMenu: {
    demo: (
      <Carbon.OverflowMenu ariaLabel="More">
        <Carbon.OverflowMenuItem itemText="One" />
        <Carbon.OverflowMenuItem itemText="Two" />
      </Carbon.OverflowMenu>
    ),
  },
  ContainedList: {
    demo: (
      <Carbon.ContainedList label="List">
        <Carbon.ContainedListItem>First</Carbon.ContainedListItem>
        <Carbon.ContainedListItem>Second</Carbon.ContainedListItem>
      </Carbon.ContainedList>
    ),
  },
  TreeView: {
    demo: (
      <Carbon.TreeView
        label="Tree"
        nodes={[{ id: 'n1', label: 'Root', nodes: [{ id: 'n2', label: 'Leaf' }] }]}
      />
    ),
  },
  DatePicker: {
    demo: (
      <Carbon.DatePicker datePickerType="single">
        <Carbon.DatePickerInput id="x-date" labelText="Date" placeholder="mm/dd/yyyy" />
      </Carbon.DatePicker>
    ),
  },
  TimePicker: {
    demo: <Carbon.TimePicker id="x-time" labelText="Time" placeholder="hh:mm" />,
  },
  FileUploader: {
    demo: (
      <Carbon.FileUploader
        id="x-file"
        labelTitle="Upload"
        labelDescription="Max 5MB"
        buttonLabel="Add file"
      />
    ),
  },
  PaginationNav: {
    demo: <Carbon.PaginationNav totalItems={30} onChange={() => {}} />,
  },
  Pagination: {
    demo: (
      <Carbon.Pagination
        page={1}
        pageSize={10}
        pageSizes={[10]}
        totalItems={30}
        onChange={() => {}}
      />
    ),
  },
  Tooltip: {
    demo: (
      <Carbon.Tooltip label="Helpful hint">
        <Carbon.Button kind="ghost">Hover me</Carbon.Button>
      </Carbon.Tooltip>
    ),
  },
  Toggletip: {
    demo: (
      <Carbon.Toggletip label="More info">
        <p>Extra detail.</p>
      </Carbon.Toggletip>
    ),
  },
  Popover: {
    demo: (
      <Carbon.Popover open label="Note">
        <Carbon.Button kind="ghost">Anchor</Carbon.Button>
      </Carbon.Popover>
    ),
  },
  Notification: {
    demo: (
      <Carbon.InlineNotification
        kind="info"
        title="Self-hosted"
        subtitle="Rendered from your own repo."
      />
    ),
  },
  ProgressBar: { demo: <Carbon.ProgressBar label="Loading" value={65} /> },
  ProgressIndicator: {
    demo: (
      <Carbon.ProgressIndicator currentIndex={1}>
        <Carbon.ProgressStep label="First" />
        <Carbon.ProgressStep label="Second" />
        <Carbon.ProgressStep label="Third" />
      </Carbon.ProgressIndicator>
    ),
  },
  InlineLoading: {
    demo: <Carbon.InlineLoading status="active" description="Working" />,
  },
  UIShell: {
    demo: (
      <Carbon.Header aria-label="Demo">
        <Carbon.HeaderName href="#branding" prefix="">
          BongDesign
        </Carbon.HeaderName>
      </Carbon.Header>
    ),
  },
  Theme: {
    demo: (
      <Carbon.Theme theme="g10">
        <div style={{ padding: '1rem' }}>Themed block (g10).</div>
      </Carbon.Theme>
    ),
  },
  AspectRatio: {
    demo: (
      <Carbon.AspectRatio ratio="16x9">
        <div style={{ background: '#e0e0e0', height: '100%' }}>16:9</div>
      </Carbon.AspectRatio>
    ),
  },
  ContentSwitcher: {
    demo: (
      <Carbon.ContentSwitcher onChange={() => {}}>
        <Carbon.Switch name="a" text="First" />
        <Carbon.Switch name="b" text="Second" />
      </Carbon.ContentSwitcher>
    ),
  },
  CopyButton: { demo: <Carbon.CopyButton onClick={() => {}} /> },
};

const SKIP = new Set([
  'ClassPrefix',
  'FeatureFlags',
  'IdPrefix',
  'Plex',
  'Portal',
  'ErrorBoundary',
]);

function genericProps(name) {
  if (/MultiSelect|ComboBox|Dropdown|ListBox/.test(name))
    return {
      id: `x-${name.toLowerCase()}`,
      label: 'Choose',
      titleText: name,
      items: [
        { id: 'a', text: 'Alpha' },
        { id: 'b', text: 'Beta' },
      ],
    };
  if (name === 'RadioButton') return { id: 'x-radiobutton', labelText: name, value: 'x' };
  if (/Button$/.test(name)) return { children: 'Example' };
  if (/^(Tag|Text|Heading|Link|Tile|Section|Slug)$/.test(name))
    return { children: 'Example' };
  if (/TileGroup$/.test(name)) return { children: 'Example' };
  if (/^(TextInput|PasswordInput|NumberInput|Search|Slider|Toggle|Checkbox|Select|Dropdown|ComboBox|MultiSelect|DatePickerInput|FluidTextInput|FluidSelect|FluidDropdown|FluidComboBox|FluidMultiSelect|FluidSearch|FluidNumberInput|FluidDatePickerInput|FluidTimePicker|FluidTextArea)$/.test(name))
    return { id: `x-${name.toLowerCase()}`, labelText: name };
  if (/TextArea$/.test(name)) return { id: `x-${name.toLowerCase()}`, labelText: name };
  return {};
}

function withHelpers(name, props) {
  if (/MultiSelect|ComboBox|Dropdown|ListBox/.test(name)) {
    return { ...props, itemToString: (i) => (i ? i.text : '') };
  }
  return props;
}

function snippet(name, curated) {
  if (curated) return `import { ${name} } from '@carbon/react';\n// see live render above`;
  const props = genericProps(name);
  const attrs = Object.entries(props)
    .map(([k, v]) => (k === 'children' ? '' : ` ${k}="${v}"`))
    .join('');
  const inner = props.children || '';
  return `import { ${name} } from '@carbon/react';\n<${name}${attrs}>${inner}</${name}>`;
}

function docSlug(entry) {
  return entry.doc ? `https://www.carbondesignsystem.com/components/${entry.doc}` : null;
}

export function componentCards() {
  const names = index.components.map((c) => c.name);
  const byName = Object.fromEntries(index.components.map((c) => [c.name, c]));
  const cards = [];
  for (const name of names) {
    const C = Carbon[name];
    const curated = CURATED[name];
    if (curated) {
      cards.push({ name, demo: curated.demo, code: snippet(name, true), live: true });
    } else if (typeof C === 'function' || (C && C.$$typeof)) {
      if (SKIP.has(name)) {
        cards.push({ name, demo: null, code: snippet(name, false), live: false, note: 'Utility — code only.' });
        continue;
      }
      const Cmp = C;
      const props = withHelpers(name, genericProps(name));
      cards.push({
        name,
        demo: <Cmp {...props} />,
        code: snippet(name, false),
        live: true,
      });
    } else {
      cards.push({
        name,
        demo: null,
        code: snippet(name, false),
        live: false,
        note: 'Rendered inside a parent demo above — see code.',
      });
    }
  }
  return { cards, byName };
}

export default function Explorer() {
  const [query, setQuery] = useState('');
  const { cards, byName } = useMemo(componentCards, []);
  const q = query.trim().toLowerCase();
  const shown = cards.filter((c) => c.name.toLowerCase().includes(q));
  const groups = {};
  for (const c of shown) {
    const g = category(c.name);
    (groups[g] = groups[g] || []).push(c);
  }
  return (
    <div>
      <p>
        {cards.length} of {cards.length} indexed components. Type to filter.
      </p>
      <Carbon.Search
        id="explorer-search"
        labelText="Filter components"
        placeholder="e.g. modal"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {Object.keys(groups)
        .sort()
        .map((g) => (
          <div key={g} className="bong-section">
            <h3>
              {g} ({groups[g].length})
            </h3>
            {groups[g].map((c) => (
              <div key={c.name} data-demo={c.name} style={{ marginTop: '1.5rem' }}>
                <h4>{c.name}</h4>
                {c.live ? (
                  <DemoBoundary>
                    <div className="bong-demo-row">{c.demo}</div>
                  </DemoBoundary>
                ) : (
                  <p>{c.note}</p>
                )}
                <pre style={{ overflowX: 'auto', background: '#f4f4f4', padding: '1rem' }}>
                  <code>{c.code}</code>
                </pre>
                {byName[c.name] && byName[c.name].doc ? (
                  <p>
                    <Link href={docSlug(byName[c.name])}>Upstream docs</Link>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
