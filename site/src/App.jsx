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
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  Toggle,
  Tooltip,
} from '@carbon/react';
import index from '../../data/components.json';

const headers = [{ key: 'name', header: 'Component' }];
const rows = [
  { id: '1', name: 'Accordion' },
  { id: '2', name: 'Button' },
  { id: '3', name: 'DataTable' },
];

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="bong-page">
      <h1>BongDesign</h1>
      <p>
        Self-hosted Carbon component library, pinned to upstream Carbon{' '}
        {index.meta.carbonTag}. {index.components.length} components indexed.
        Source: your own repo, no IBM account needed.
      </p>

      <div className="bong-section">
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
                      <table {...getTableProps()}>
                        <thead>
                          <tr>
                            {h.map((header) => (
                              <th key={header.key} {...getHeaderProps({ header })}>
                                {header.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.map((row) => (
                            <tr key={row.id} {...getRowProps({ row })}>
                              {row.cells.map((cell) => (
                                <td key={cell.id}>{cell.value}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

      <div className="bong-section" id="index">
        <h2>Component index</h2>
        <p>Every component directory present in the pinned upstream release.</p>
        <div className="bong-index">
          {index.components.map((c) => (
            <div key={c.name}>
              {c.name}
              {c.doc ? ` — ${c.doc}` : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="bong-footer">
        <p>
          BongDesign {index.meta.carbonTag} · upstream Carbon snapshot, own repo ·
          MCP at <code>/mcp</code> · health at <code>/health</code>
        </p>
      </div>
    </div>
  );
}
