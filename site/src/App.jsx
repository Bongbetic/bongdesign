import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  DataTable,
  Dropdown,
  Header,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  InlineNotification,
  Link,
  Modal,
  NumberInput,
  PasswordInput,
  ProgressBar,
  RadioButton,
  RadioButtonGroup,
  Search,
  Select,
  SelectItem,
  Slider,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TabPanel,
  TabPanels,
  TabRow,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  Toggle,
  Tooltip,
} from '@carbon/react';
import index from '../../data/components.json';
import Explorer from './explorer.jsx';
import Foundations from './foundations.jsx';

const headers = [{ key: 'name', header: 'Component' }];
const rows = [
  { id: '1', name: 'Accordion' },
  { id: '2', name: 'Button' },
  { id: '3', name: 'DataTable' },
];

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="bong-page" style={{ paddingTop: '5rem' }}>
      <Header aria-label="BongDesign">
        <HeaderName href="#branding" prefix="">
          <img
            src="https://bongbetic.com/branding/bongbetic-wordmark@2x.png"
            alt="Bongbetic"
            width="125"
            height="28"
            style={{ marginRight: '0.75rem' }}
          />
          BongDesign
        </HeaderName>
        <HeaderNavigation aria-label="Site">
          <HeaderMenuItem href="#branding">Branding</HeaderMenuItem>
          <HeaderMenuItem href="#foundations">Foundations</HeaderMenuItem>
          <HeaderMenuItem href="#index">Components</HeaderMenuItem>
          <HeaderMenuItem href="https://www.carbondesignsystem.com">Upstream docs</HeaderMenuItem>
        </HeaderNavigation>
      </Header>
      <header className="bong-header">
        <a href="https://bongbetic.com">
          <img
            src="https://bongbetic.com/branding/bongbetic-wordmark@2x.png"
            alt="Bongbetic"
            width="188"
            height="42"
          />
        </a>
        <span className="bong-header-sub">BongDesign — self-hosted Carbon component library</span>
      </header>
      <div className="bong-red-rule" aria-hidden="true" />
      <nav className="bong-nav">
        <Link href="#demos">Gallery</Link>
        {' · '}
        <Link href="#branding">Branding</Link>
        {' · '}
        <Link href="#index">Components</Link>
      </nav>
      <p>
        Self-hosted Carbon component library, pinned to upstream Carbon{' '}
        {index.meta.carbonTag}. {index.components.length} components indexed.
        Source: your own repo, no IBM account needed.
      </p>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <nav style={{ flex: '0 0 12rem', position: 'sticky', top: '4rem' }}>
          <strong>Building blocks</strong>
          <div style={{ marginTop: '0.5rem' }}>
            <div>Foundations</div>
            <div style={{ paddingLeft: '1rem' }}>
              <div><Link href="#foundations-2x-grid">2x Grid</Link></div>
              <div><Link href="#foundations-accessibility">Accessibility</Link></div>
              <div><Link href="#foundations-carbon-for-ai">Carbon for AI</Link></div>
              <div><Link href="#foundations-color">Color</Link></div>
              <div><Link href="#foundations-content">Content</Link></div>
              <div><Link href="#foundations-icons">Icons</Link></div>
              <div><Link href="#foundations-pictograms">Pictograms</Link></div>
              <div><Link href="#foundations-motion">Motion</Link></div>
              <div><Link href="#foundations-spacing">Spacing</Link></div>
              <div><Link href="#foundations-themes">Themes</Link></div>
              <div><Link href="#foundations-typography">Typography</Link></div>
            </div>
            <div style={{ marginTop: '0.5rem' }}><Link href="#index">Components</Link></div>
            <div><Link href="#patterns">Patterns</Link></div>
            <div><Link href="#data-viz">Data visualization</Link></div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <strong>Building experiences</strong>
            <div><Link href="#building-experiences">Overview</Link></div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <strong>Support</strong>
            <div><Link href="#support">Get help</Link></div>
          </div>
        </nav>
        <div style={{ flex: '1', minWidth: 0 }}>
      <div className="bong-section" id="demos">
        <h2>Live demos</h2>
        <div className="bong-demo-row">
          <Button kind="primary">Primary</Button>
          <Button kind="secondary">Secondary</Button>
          <Button kind="danger">Danger</Button>
          <Tag type="green">Green tag</Tag>
          <Tag type="purple">Purple tag</Tag>
          <Link href="#index">Component index</Link>
        </div>
        <div className="bong-demo-row">
          <Checkbox id="demo-check" labelText="Checkbox" />
          <Toggle id="demo-toggle" labelText="Toggle" />
          <Search id="demo-search" labelText="Search" placeholder="Search" />
        </div>
        <div className="bong-demo-row">
          <TextInput id="demo-text" labelText="Text input" placeholder="Type here" />
          <PasswordInput id="demo-pass" labelText="Password" />
          <NumberInput id="demo-num" label="Number" min={0} max={10} value={3} />
        </div>
        <div className="bong-demo-row">
          <Select id="demo-select" labelText="Select">
            <SelectItem value="a" text="Option A" />
            <SelectItem value="b" text="Option B" />
          </Select>
          <Dropdown
            id="demo-drop"
            titleText="Dropdown"
            label="Choose"
            items={[{ id: 'a', text: 'Alpha' }, { id: 'b', text: 'Beta' }]}
            itemToString={(i) => (i ? i.text : '')}
          />
          <Slider id="demo-slider" labelText="Slider" min={0} max={100} value={40} />
        </div>
        <div className="bong-demo-row">
          <RadioButtonGroup legendText="Radio group" name="demo-radio" defaultSelected="r1">
            <RadioButton id="r1" labelText="One" value="r1" />
            <RadioButton id="r2" labelText="Two" value="r2" />
          </RadioButtonGroup>
          <TextArea id="demo-area" labelText="Text area" placeholder="Longer text" />
          <Tooltip label="Helpful hint">
            <Button kind="ghost">Hover me</Button>
          </Tooltip>
        </div>
        <div className="bong-demo-row">
          <ProgressBar label="Loading" value={65} />
          <Button kind="tertiary" onClick={() => setModalOpen(true)}>Open modal</Button>
        </div>
        <div className="bong-demo-row">
          <Breadcrumb>
            <BreadcrumbItem>
              <Link href="#index">Home</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>Gallery</BreadcrumbItem>
          </Breadcrumb>
        </div>
        <InlineNotification
          kind="info"
          title="Self-hosted"
          subtitle="This page renders from your own repo."
        />
        <Accordion>
          <AccordionItem title="Tabs and table">
            <Tabs>
              <TabList>
                <Tab>Table</Tab>
                <Tab>About</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <DataTable rows={rows} headers={headers}>
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
                </TabPanel>
                <TabPanel>Rendered with pinned @carbon/react only.</TabPanel>
              </TabPanels>
            </Tabs>
          </AccordionItem>
        </Accordion>
        <Modal
          open={modalOpen}
          modalHeading="BongDesign modal"
          primaryButtonText="Done"
          onRequestClose={() => setModalOpen(false)}
          onRequestSubmit={() => setModalOpen(false)}
        >
          <p>Modals work from the self-hosted bundle.</p>
        </Modal>
      </div>

      <div className="bong-section" id="branding">
        <h2>Branding</h2>
        <p>
          The wordmark, the glyph, the icons and the one red. Black, white, and
          red: it is not a large palette. Full rules on the{' '}
          <Link href="https://bongbetic.com/branding">main branding page</Link>.
        </p>
        <h3>Wordmark</h3>
        <p>Dark text, red o and e. For white and pale backgrounds.</p>
        <img
          src="https://bongbetic.com/branding/bongbetic-wordmark@2x.png"
          alt="Bongbetic wordmark for light backgrounds"
          width="314"
          height="70"
        />
        <p>White text, red o and e. For black and dark backgrounds.</p>
        <div style={{ background: '#000', padding: '1rem', display: 'inline-block' }}>
          <img
            src="https://bongbetic.com/branding/bongbetic-wordmark-dark@2x.png"
            alt="Bongbetic wordmark for dark backgrounds"
            width="314"
            height="70"
          />
        </div>
        <h3>Glyph</h3>
        <p>The B on its own, for places too small to spell the whole name.</p>
        <img
          src="https://bongbetic.com/branding/bongbetic-glyph.svg"
          alt="Bongbetic glyph"
          width="96"
          height="96"
        />
        <h3>App icons</h3>
        <div className="bong-demo-row">
          <figure style={{ margin: 0 }}>
            <img
              src="https://bongbetic.com/branding/bongbetic-icon-light-192.png"
              alt="Bongbetic icon for light backgrounds"
              width="96"
              height="96"
            />
            <figcaption>For light backgrounds</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            <span style={{ background: '#000', padding: '0.5rem', display: 'inline-block' }}>
              <img
                src="https://bongbetic.com/branding/bongbetic-icon-dark-192.png"
                alt="Bongbetic icon for dark backgrounds"
                width="96"
                height="96"
              />
            </span>
            <figcaption>For dark backgrounds</figcaption>
          </figure>
        </div>
        <h3>Colour</h3>
        <div className="bong-demo-row">
          <span style={{ background: '#e11d2a', color: '#fff', padding: '1rem' }}>Red #e11d2a — accent only</span>
          <span style={{ background: '#000', color: '#fff', padding: '1rem' }}>Black #000000</span>
          <span style={{ border: '1px solid #000', padding: '1rem' }}>White #ffffff</span>
        </div>
        <h3>Rules</h3>
        <p>
          Clear space: the height of the letter b on every side, never below 96
          pixels wide. No new colours, gradients, outlines, shadows or glows.
          Do not recolour the o and e, stretch, rotate, crop or redraw.
        </p>
        <h3>Downloads</h3>
        <ul>
          <li><Link href="https://bongbetic.com/branding/bongbetic-wordmark@2x.png">Wordmark, light backgrounds (PNG)</Link></li>
          <li><Link href="https://bongbetic.com/branding/bongbetic-wordmark-dark@2x.png">Wordmark, dark backgrounds (PNG)</Link></li>
          <li><Link href="https://bongbetic.com/branding/bongbetic-glyph.svg">Glyph (SVG)</Link></li>
          <li><Link href="https://bongbetic.com/branding/bongbetic-icon-light-512.png">Icon, light (512 PNG)</Link></li>
          <li><Link href="https://bongbetic.com/branding/bongbetic-icon-dark-512.png">Icon, dark (512 PNG)</Link></li>
        </ul>
      </div>

      <div className="bong-section" id="foundations">
        <Foundations />
      </div>

      <div className="bong-section" id="index">
        <h2>All components</h2>
        <p>
          Every component in the pinned upstream release, rendered live from
          your own repo.
        </p>
        <Explorer />
      </div>

      <div className="bong-section" id="patterns">
        <h2>Patterns</h2>
        <p>Reusable solutions for common jobs, in your own words:</p>
        <ul>
          <li>Empty states: say what is missing and give one clear way forward.</li>
          <li>Forms: one question per row, errors where the work is.</li>
          <li>Loading: show progress, never block the whole screen.</li>
          <li>Notifications: brief, specific, and gone when read.</li>
          <li>Search: fast feedback while typing, honest empty results.</li>
        </ul>
        <p>
          <Link href="https://www.carbondesignsystem.com/patterns/overview">Upstream patterns</Link>
        </p>
      </div>

      <div className="bong-section" id="data-viz">
        <h2>Data visualization</h2>
        <p>
          Charts live in a separate upstream package and are not vendored here.
          When a chart is needed, pin it the same way as the rest.{' '}
          <Link href="https://www.carbondesignsystem.com/data-visualization/overview">Upstream guidance</Link>
        </p>
      </div>

      <div className="bong-section" id="building-experiences">
        <h2>Building experiences</h2>
        <p>
          Start from a working vertical slice, then grow. Keep the design system
          the source of interface truth so pages stay consistent as they scale.
        </p>
      </div>

      <div className="bong-section" id="support">
        <h2>Support</h2>
        <p>
          Repo:{' '}
          <Link href="https://github.com/Bongbetic/bongdesign">Bongbetic/bongdesign</Link>.
          Upstream: <Link href="https://www.carbondesignsystem.com">carbondesignsystem.com</Link>.
          MCP: <code>/mcp</code> on this host, token required.
        </p>
      </div>

      <div className="bong-footer">
        <p>
          BongDesign {index.meta.carbonTag} · upstream Carbon snapshot, own repo ·
          MCP at <code>/mcp</code> · health at <code>/health</code>
        </p>
        <p>
          Built by <Link href="https://bongbetic.com">Bongbetic</Link>. Free software,
          loud opinions, no warranty (see your licence).
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}
