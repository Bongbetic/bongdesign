import React, { useMemo, useState } from 'react';
import * as Carbon from '@carbon/react';
import { Link } from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';
import index from '../../data/components.json';
import guidelines from '../../data/guidelines.json';

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
  const [open, setOpen] = useState(true);
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

function DemoComposedModal() {
  const [open, setOpen] = useState(true);
  const { Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput, Select, SelectItem } = Carbon;
  const close = () => setOpen(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add data source</Button>
      <ComposedModal open={open} onClose={close}>
        <ModalHeader label="Catalog" title="Add a data source" />
        <ModalBody>
          <p style={{ marginBottom: '1rem' }}>
            Data sources sync nightly into the workspace catalog. Owners can
            remap schemas after the first import.
          </p>
          <TextInput
            data-modal-primary-focus
            id="bd-source-url"
            labelText="Source URL"
            placeholder="https://data.bongbetic.com/events"
            style={{ marginBottom: '1rem' }}
          />
          <Select id="bd-source-region" labelText="Region" defaultValue="eu-de">
            <SelectItem value="eu-de" text="EU Germany" />
            <SelectItem value="us-south" text="US South" />
          </Select>
        </ModalBody>
        <ModalFooter primaryButtonText="Add" secondaryButtonText="Cancel" onRequestSubmit={close} />
      </ComposedModal>
    </>
  );
}

// CURATED live demos adapt each component's Default story args/structure from
// the tracked upstream snapshot (upstream-carbon/packages/react/src/components
// — *.stories.js + *.mdx, Apache-2.0, (c) IBM), cross-checked against the mined
// examples in data/props.json. Copy is realistic BongDesign content.
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
        titleText="Template"
        label="Choose a template"
        helperText="Applies to the next publish."
        placeholder="Type to filter"
        items={[{ id: 'd', text: 'Dashboard' }, { id: 'r', text: 'Report' }]}
        itemToString={(i) => (i ? i.text : '')}
        onChange={() => {}}
      />
    ),
  },
  MultiSelect: {
    demo: (
      <Carbon.MultiSelect
        id="x-multi"
        titleText="Pick"
        label="Choose several"
        open
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
      <Carbon.OverflowMenu aria-label="Report actions" open>
        <Carbon.OverflowMenuItem itemText="Download CSV" onClick={() => {}} />
        <Carbon.OverflowMenuItem itemText="Schedule email" onClick={() => {}} />
        <Carbon.OverflowMenuItem itemText="Rename dashboard" onClick={() => {}} />
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
        label="Component catalog"
        nodes={[
          {
            id: 'cat',
            label: 'BongDesign',
            nodes: [
              { id: 'tok', label: 'Tokens' },
              {
                id: 'comp',
                label: 'Components',
                nodes: [
                  { id: 'btn', label: 'Button' },
                  { id: 'modal', label: 'Modal' },
                ],
              },
            ],
          },
          { id: 'guide', label: 'Guidelines' },
        ]}
      />
    ),
  },
  DatePicker: {
    demo: (
      <Carbon.DatePicker datePickerType="single">
        <Carbon.DatePickerInput
          id="x-date"
          labelText="Launch date"
          helperText="Freeze is Friday."
          placeholder="mm/dd/yyyy"
        />
      </Carbon.DatePicker>
    ),
  },
  TimePicker: {
    demo: (
      <Carbon.TimePicker
        id="x-time"
        labelText="Daily sync"
        placeholder="hh:mm"
      />
    ),
  },
  FileUploader: {
    demo: (
      <Carbon.FileUploader
        id="x-file"
        labelTitle="Upload"
        labelDescription="Max 5MB"
        buttonLabel="Add file"
        filenameStatus="edit"
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
      <Carbon.Tooltip label="Helpful hint" defaultOpen>
        <Carbon.Button kind="ghost">Hover me</Carbon.Button>
      </Carbon.Tooltip>
    ),
  },
  Toggletip: {
    demo: (
      <Carbon.Toggletip label="More info" defaultOpen>
        <p>Extra detail.</p>
      </Carbon.Toggletip>
    ),
  },
  Popover: {
    demo: (
      <Carbon.Popover open align="bottom">
        <Carbon.Button kind="ghost">Export</Carbon.Button>
        <Carbon.PopoverContent>
          <p>Exports include tokens, icons, and component metadata.</p>
        </Carbon.PopoverContent>
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
  Loading: {
    demo: <Carbon.Loading withOverlay={false} small description="Loading" />,
  },
  ProgressBar: {
    demo: (
      <Carbon.ProgressBar label="Token migration" helperText="65 of 100 tokens migrated." value={65} max={100} />
    ),
  },
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
  AccordionItem: {
    demo: (
      <Carbon.Accordion>
        <Carbon.AccordionItem title="Getting started">
          <p>Install the package, wrap the app in the shell, and render a page.</p>
        </Carbon.AccordionItem>
        <Carbon.AccordionItem title="Design tokens">
          <p>Colors, type, spacing, and motion ship as versioned JSON.</p>
        </Carbon.AccordionItem>
        <Carbon.AccordionItem title="Support">
          <p>File issues against the design-system backlog each sprint.</p>
        </Carbon.AccordionItem>
      </Carbon.Accordion>
    ),
  },
  AILabel: {
    demo: (
      <div>
        <p>Release summary drafted with AI assistance.</p>
        <Carbon.AILabel kind="inline" textLabel="Drafted with watsonx">
          <Carbon.AILabelContent>
            <p>Generative AI drafted this summary. Verify figures before publishing.</p>
          </Carbon.AILabelContent>
        </Carbon.AILabel>
      </div>
    ),
  },
  BreadcrumbItem: {
    demo: (
      <Carbon.Breadcrumb>
        <Carbon.BreadcrumbItem>
          <Link href="#branding">Home</Link>
        </Carbon.BreadcrumbItem>
        <Carbon.BreadcrumbItem>
          <Link href="#components">Components</Link>
        </Carbon.BreadcrumbItem>
        <Carbon.BreadcrumbItem isCurrentPage>Button</Carbon.BreadcrumbItem>
      </Carbon.Breadcrumb>
    ),
  },
  Button: {
    demo: (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Carbon.Button kind="primary">Create dashboard</Carbon.Button>
        <Carbon.Button kind="secondary">Save as draft</Carbon.Button>
        <Carbon.Button kind="tertiary">Preview</Carbon.Button>
        <Carbon.Button kind="ghost">Cancel</Carbon.Button>
      </div>
    ),
  },
  PrimaryButton: {
    demo: (
      <Carbon.PrimaryButton renderIcon={Add}>Create dashboard</Carbon.PrimaryButton>
    ),
  },
  SecondaryButton: {
    demo: <Carbon.SecondaryButton renderIcon={Add}>Save as draft</Carbon.SecondaryButton>,
  },
  DangerButton: {
    demo: <Carbon.DangerButton renderIcon={TrashCan}>Delete workspace</Carbon.DangerButton>,
  },
  ButtonSet: {
    demo: (
      <Carbon.ButtonSet>
        <Carbon.Button kind="secondary">Back</Carbon.Button>
        <Carbon.Button kind="primary">Submit for review</Carbon.Button>
      </Carbon.ButtonSet>
    ),
  },
  Checkbox: {
    demo: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Carbon.Checkbox id="bd-note-release" labelText="Email me release notes" helperText="One message per release." defaultChecked />
        <Carbon.Checkbox id="bd-note-preview" labelText="Include prerelease builds" />
      </div>
    ),
  },
  CheckboxGroup: {
    demo: (
      <Carbon.CheckboxGroup legendText="Notification channels" helperText="Pick at least one.">
        <Carbon.Checkbox id="bd-ch-email" labelText="Email" defaultChecked />
        <Carbon.Checkbox id="bd-ch-slack" labelText="Slack" />
        <Carbon.Checkbox id="bd-ch-sms" labelText="SMS" />
      </Carbon.CheckboxGroup>
    ),
  },
  CodeSnippet: {
    demo: (
      <Carbon.CodeSnippet type="multi" feedback="Copied to clipboard">{`npm install @carbon/react
npm run build`}</Carbon.CodeSnippet>
    ),
  },
  ComboButton: {
    demo: (
      <Carbon.ComboButton label="Publish">
        <Carbon.MenuItem label="Publish now" />
        <Carbon.MenuItem label="Schedule for Monday" />
        <Carbon.MenuItem label="Save as draft" />
      </Carbon.ComboButton>
    ),
  },
  ComposedModal: { demo: <DemoComposedModal /> },
  Copy: {
    demo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <code>bongdesign@1.119.0</code>
        <Carbon.Copy onClick={() => {}} aria-label="Copy version" />
      </div>
    ),
  },
  DataTableSkeleton: {
    demo: (
      <div role="status">
        <span className="cds--visually-hidden">Loading component catalog rows.</span>
        <Carbon.DataTableSkeleton rowCount={5} columnCount={3} showHeader showToolbar />
      </div>
    ),
  },
  DatePickerInput: {
    demo: (
      <Carbon.DatePicker datePickerType="range">
        <Carbon.DatePickerInput id="bd-range-start" labelText="Start date" placeholder="mm/dd/yyyy" />
        <Carbon.DatePickerInput id="bd-range-end" labelText="End date" placeholder="mm/dd/yyyy" />
      </Carbon.DatePicker>
    ),
  },
  ExpandableSearch: {
    demo: (
      <Carbon.ExpandableSearch id="bd-expand" labelText="Search components" placeholder="e.g. modal" closeButtonLabelText="Clear search" onChange={() => {}} />
    ),
  },
  FlexGrid: {
    demo: (
      <Carbon.FlexGrid>
        <Carbon.Row>
          <Carbon.Column sm={4}>
            <p>Tokens ship as JSON.</p>
          </Carbon.Column>
          <Carbon.Column sm={4}>
            <p>Icons ship as React.</p>
          </Carbon.Column>
          <Carbon.Column sm={4}>
            <p>Styles ship as SCSS.</p>
          </Carbon.Column>
        </Carbon.Row>
      </Carbon.FlexGrid>
    ),
  },
  Grid: {
    demo: (
      <Carbon.Grid>
        <Carbon.Row>
          <Carbon.Column sm={4}>
            <h4>Foundations</h4>
            <p>Color, type, spacing, motion.</p>
          </Carbon.Column>
          <Carbon.Column sm={4}>
            <h4>Components</h4>
            <p>147 entries with live demos.</p>
          </Carbon.Column>
        </Carbon.Row>
      </Carbon.Grid>
    ),
  },
  Stack: {
    demo: (
      <Carbon.Stack gap={4}>
        <span>Tokens</span>
        <span>Icons</span>
        <span>Components</span>
      </Carbon.Stack>
    ),
  },
  Layer: {
    demo: (
      <Carbon.Layer>
        <p>Layer one: cards and tiles resolve tokens against this background.</p>
      </Carbon.Layer>
    ),
  },
  FluidComboBox: {
    demo: (
      <Carbon.FluidComboBox id="bd-fluid-combo" titleText="Region" label="Choose a region" helperText="Applies on next deploy." items={[{ id: 'd', text: 'EU Germany' }, { id: 'u', text: 'US South' }]} itemToString={(i) => (i ? i.text : '')} onChange={() => {}} />
    ),
  },
  FluidDatePicker: {
    demo: (
      <Carbon.FluidDatePicker datePickerType="single">
        <Carbon.FluidDatePickerInput id="bd-fluid-launch" labelText="Launch date" placeholder="mm/dd/yyyy" />
      </Carbon.FluidDatePicker>
    ),
  },
  FluidDatePickerInput: {
    demo: (
      <Carbon.FluidDatePicker datePickerType="single">
        <Carbon.FluidDatePickerInput id="bd-fluid-freeze" labelText="Freeze date" helperText="No deploys after freeze." placeholder="mm/dd/yyyy" />
      </Carbon.FluidDatePicker>
    ),
  },
  FluidDropdown: {
    demo: (
      <Carbon.FluidDropdown id="bd-fluid-drop" titleText="Environment" label="Choose an environment" helperText="Staging mirrors production." items={[{ id: 'p', text: 'Production' }, { id: 's', text: 'Staging' }]} itemToString={(i) => (i ? i.text : '')} onChange={() => {}} />
    ),
  },
  FluidForm: {
    demo: (
      <Carbon.FluidForm aria-label="Invite teammate" onSubmit={(e) => e.preventDefault()}>
        <Carbon.FluidTextInput id="bd-fluid-name" labelText="Full name" placeholder="Ada Lovelace" />
        <Carbon.FluidTextInput id="bd-fluid-email" labelText="Work email" placeholder="ada@bongbetic.com" />
        <Carbon.Button type="submit">Send invite</Carbon.Button>
      </Carbon.FluidForm>
    ),
  },
  FluidMultiSelect: {
    demo: (
      <Carbon.FluidMultiSelect id="bd-fluid-multi" titleText="Reviewers" label="Choose reviewers" helperText="Two approvals required." open items={[{ id: 'a', text: 'Design' }, { id: 'b', text: 'Engineering' }]} itemToString={(i) => (i ? i.text : '')} onChange={() => {}} />
    ),
  },
  FluidNumberInput: {
    demo: (
      <Carbon.FluidNumberInput id="bd-fluid-seats" label="Team seats" helperText="1 to 200 seats." defaultValue={25} min={1} max={200} onChange={() => {}} onClick={() => {}} />
    ),
  },
  FluidSearch: {
    demo: (
      <Carbon.FluidSearch id="bd-fluid-search" labelText="Search components" placeholder="e.g. modal" closeButtonLabelText="Clear search" onChange={() => {}} />
    ),
  },
  FluidSelect: {
    demo: (
      <Carbon.FluidSelect id="bd-fluid-select" labelText="Environment" defaultValue="prod">
        <Carbon.SelectItem value="prod" text="Production" />
        <Carbon.SelectItem value="stage" text="Staging" />
      </Carbon.FluidSelect>
    ),
  },
  FluidTextArea: {
    demo: (
      <Carbon.FluidTextArea id="bd-fluid-notes" labelText="Release notes" helperText="Shown on the changelog." placeholder="Bump tokens to v1.119." rows={3} onChange={() => {}} />
    ),
  },
  FluidTextInput: {
    demo: (
      <Carbon.FluidTextInput id="bd-fluid-workspace" labelText="Workspace name" helperText="Lowercase, no spaces." placeholder="bongdesign" onChange={() => {}} />
    ),
  },
  FluidTimePicker: {
    demo: (
      <Carbon.FluidTimePicker id="bd-fluid-sync" labelText="Daily sync" placeholder="hh:mm">
        <Carbon.FluidTimePickerSelect id="bd-fluid-clock">
          <Carbon.SelectItem value="am" text="AM" />
          <Carbon.SelectItem value="pm" text="PM" />
        </Carbon.FluidTimePickerSelect>
        <Carbon.FluidTimePickerSelect id="bd-fluid-tz">
          <Carbon.SelectItem value="cet" text="CET" />
          <Carbon.SelectItem value="utc" text="UTC" />
        </Carbon.FluidTimePickerSelect>
      </Carbon.FluidTimePicker>
    ),
  },
  FluidTimePickerSelect: {
    demo: (
      <Carbon.FluidTimePicker id="bd-fluid-standup" labelText="Standup time" placeholder="hh:mm">
        <Carbon.FluidTimePickerSelect id="bd-fluid-mer">
          <Carbon.SelectItem value="am" text="AM" />
          <Carbon.SelectItem value="pm" text="PM" />
        </Carbon.FluidTimePickerSelect>
        <Carbon.FluidTimePickerSelect id="bd-fluid-zone">
          <Carbon.SelectItem value="cet" text="CET" />
          <Carbon.SelectItem value="utc" text="UTC" />
        </Carbon.FluidTimePickerSelect>
      </Carbon.FluidTimePicker>
    ),
  },
  Form: {
    demo: (
      <Carbon.Form aria-label="Invite teammate" onSubmit={(e) => e.preventDefault()}>
        <Carbon.Stack gap={5}>
          <Carbon.TextInput id="bd-form-name" labelText="Full name" placeholder="Ada Lovelace" onChange={() => {}} />
          <Carbon.TextInput id="bd-form-email" labelText="Work email" placeholder="ada@bongbetic.com" onChange={() => {}} />
          <Carbon.Button type="submit">Send invite</Carbon.Button>
        </Carbon.Stack>
      </Carbon.Form>
    ),
  },
  FormGroup: {
    demo: (
      <Carbon.FormGroup legendText="Contact preferences">
        <Carbon.Checkbox id="bd-fg-email" labelText="Email" defaultChecked />
        <Carbon.Checkbox id="bd-fg-slack" labelText="Slack" />
      </Carbon.FormGroup>
    ),
  },
  FormItem: {
    demo: (
      <Carbon.FormItem>
        <Carbon.TextInput id="bd-formitem-key" labelText="Project key" helperText="Two to four letters." placeholder="BD" onChange={() => {}} />
      </Carbon.FormItem>
    ),
  },
  FormLabel: {
    demo: (
      <div>
        <Carbon.FormLabel>Deployment target</Carbon.FormLabel>
        <p style={{ marginTop: '0.25rem' }}>IBM Cloud, Frankfurt region. Change it in workspace settings.</p>
      </div>
    ),
  },
  Heading: {
    demo: (
      <Carbon.Section as="article" level={3}>
        <Carbon.Heading>Delivery milestones</Carbon.Heading>
        <p>Token builds ship every release; components follow weekly.</p>
      </Carbon.Section>
    ),
  },
  IconButton: {
    demo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Q4 dashboards</span>
        <Carbon.IconButton label="Add dashboard" kind="ghost">
          <Add />
        </Carbon.IconButton>
      </div>
    ),
  },
  InlineCheckbox: {
    demo: (
      <div>
        Include prerelease builds <Carbon.InlineCheckbox id="bd-inline-pre" name="bd-inline-pre" aria-label="Include prerelease builds" />
      </div>
    ),
  },
  Link: {
    demo: (
      <Carbon.Link href="https://carbondesignsystem.com">Read the Carbon migration guide</Carbon.Link>
    ),
  },
  ListItem: {
    demo: (
      <Carbon.UnorderedList>
        <Carbon.ListItem>Install from the self-hosted registry.</Carbon.ListItem>
        <Carbon.ListItem>Build the static bundle.</Carbon.ListItem>
        <Carbon.ListItem>Serve it behind the auth wall.</Carbon.ListItem>
      </Carbon.UnorderedList>
    ),
  },
  OrderedList: {
    demo: (
      <Carbon.OrderedList>
        <Carbon.ListItem>Cut a release branch.</Carbon.ListItem>
        <Carbon.ListItem>Run the full suite.</Carbon.ListItem>
        <Carbon.ListItem>Merge with the orchestrator go-ahead.</Carbon.ListItem>
      </Carbon.OrderedList>
    ),
  },
  UnorderedList: {
    demo: (
      <Carbon.UnorderedList>
        <Carbon.ListItem>Foundations: color, type, spacing, motion.</Carbon.ListItem>
        <Carbon.ListItem>
          Components: 147 entries with live demos.
          <Carbon.UnorderedList nested>
            <Carbon.ListItem>Buttons communicate actions.</Carbon.ListItem>
            <Carbon.ListItem>Forms collect workspace input.</Carbon.ListItem>
          </Carbon.UnorderedList>
        </Carbon.ListItem>
      </Carbon.UnorderedList>
    ),
  },
  Menu: {
    demo: (
      <Carbon.Menu open onClose={() => {}}>
        <Carbon.MenuItem label="Copy link" shortcut="⌘C" />
        <Carbon.MenuItem label="Schedule email" shortcut="⌘S" />
        <Carbon.MenuItemDivider />
        <Carbon.MenuItem label="Delete report" kind="danger" />
      </Carbon.Menu>
    ),
  },
  ModalWrapper: {
    demo: (
      <Carbon.ModalWrapper buttonTriggerText="Invite teammate" modalHeading="Invite to BongDesign" primaryButtonText="Send invite" secondaryButtonText="Cancel" handleSubmit={() => {}}>
        <p>New teammates inherit the viewer role. Owners can upgrade them later.</p>
        <Carbon.TextInput id="bd-invite-email" labelText="Work email" placeholder="ada@bongbetic.com" />
      </Carbon.ModalWrapper>
    ),
  },
  NumberInput: {
    demo: (
      <Carbon.NumberInput id="bd-seats" label="Team seats" helperText="1 to 200 seats." defaultValue={25} min={1} max={200} onChange={() => {}} onClick={() => {}} />
    ),
  },
  OverflowMenuItem: {
    demo: (
      <Carbon.OverflowMenu aria-label="Export actions" open>
        <Carbon.OverflowMenuItem itemText="Download CSV" onClick={() => {}} />
        <Carbon.OverflowMenuItem itemText="Schedule email" onClick={() => {}} hasDivider />
        <Carbon.OverflowMenuItem itemText="Delete report" onClick={() => {}} isDelete />
      </Carbon.OverflowMenu>
    ),
  },
  PasswordInput: {
    demo: (
      <Carbon.PasswordInput id="bd-token" labelText="BONGDESIGN_TOKEN" helperText="Paste once; it lives only in your shell." placeholder="Enter token" onChange={() => {}} onClick={() => {}} />
    ),
  },
  RadioButton: {
    demo: (
      <Carbon.RadioButtonGroup legendText="Data retention" name="bd-retention" defaultSelected="90">
        <Carbon.RadioButton id="bd-ret-30" labelText="30 days" value="30" />
        <Carbon.RadioButton id="bd-ret-90" labelText="90 days" value="90" />
        <Carbon.RadioButton id="bd-ret-365" labelText="1 year" value="365" />
      </Carbon.RadioButtonGroup>
    ),
  },
  RadioTile: {
    demo: (
      <Carbon.TileGroup name="bd-home-layout" legend="Homepage layout" defaultSelected="grid">
        <Carbon.RadioTile id="bd-lay-grid" value="grid">Grid</Carbon.RadioTile>
        <Carbon.RadioTile id="bd-lay-list" value="list">List</Carbon.RadioTile>
      </Carbon.TileGroup>
    ),
  },
  TileGroup: {
    demo: (
      <Carbon.TileGroup name="bd-env" legend="Environment" defaultSelected="prod">
        <Carbon.RadioTile id="bd-env-prod" value="prod">Production</Carbon.RadioTile>
        <Carbon.RadioTile id="bd-env-stage" value="stage">Staging</Carbon.RadioTile>
        <Carbon.RadioTile id="bd-env-dev" value="dev">Development</Carbon.RadioTile>
      </Carbon.TileGroup>
    ),
  },
  Tile: {
    demo: (
      <Carbon.Tile id="bd-health">
        <h4 style={{ marginBottom: '0.5rem' }}>Component health</h4>
        <p>147 entries, 101 live demos, zero missing cards.</p>
      </Carbon.Tile>
    ),
  },
  Search: {
    demo: (
      <Carbon.Search id="bd-search" labelText="Search components" placeholder="e.g. modal" closeButtonLabelText="Clear search" onChange={() => {}} />
    ),
  },
  SelectItem: {
    demo: (
      <Carbon.Select id="bd-region" labelText="Region" defaultValue="eu-de">
        <Carbon.SelectItem value="us-south" text="US South" />
        <Carbon.SelectItem value="eu-de" text="EU Germany" />
        <Carbon.SelectItem value="au-syd" text="Sydney" />
      </Carbon.Select>
    ),
  },
  SelectItemGroup: {
    demo: (
      <Carbon.Select id="bd-deploy-region" labelText="Deploy region" defaultValue="eu-de">
        <Carbon.SelectItemGroup label="Americas">
          <Carbon.SelectItem value="us-south" text="US South" />
          <Carbon.SelectItem value="us-east" text="US East" />
        </Carbon.SelectItemGroup>
        <Carbon.SelectItemGroup label="Europe">
          <Carbon.SelectItem value="eu-de" text="EU Germany" />
          <Carbon.SelectItem value="eu-gb" text="United Kingdom" />
        </Carbon.SelectItemGroup>
      </Carbon.Select>
    ),
  },
  SkeletonIcon: {
    demo: (
      <div role="status">
        <span className="cds--visually-hidden">Loading author avatar.</span>
        <Carbon.SkeletonIcon />
      </div>
    ),
  },
  SkeletonPlaceholder: {
    demo: (
      <div role="status">
        <span className="cds--visually-hidden">Loading empty-state illustration.</span>
        <Carbon.SkeletonPlaceholder />
      </div>
    ),
  },
  SkeletonText: {
    demo: (
      <div role="status">
        <span className="cds--visually-hidden">Loading report summary.</span>
        <Carbon.SkeletonText heading paragraph lineCount={3} />
      </div>
    ),
  },
  Slider: {
    demo: (
      <Carbon.Slider id="bd-budget" labelText="Monthly build minutes" value={600} min={0} max={2000} step={50} onChange={() => {}} />
    ),
  },
  Switch: {
    demo: (
      <Carbon.ContentSwitcher onChange={() => {}}>
        <Carbon.Switch name="quarter" text="Quarter" />
        <Carbon.Switch name="year" text="Year" />
      </Carbon.ContentSwitcher>
    ),
  },
  Tab: {
    demo: (
      <Carbon.Tabs>
        <Carbon.TabList>
          <Carbon.Tab>Design</Carbon.Tab>
          <Carbon.Tab>Code</Carbon.Tab>
        </Carbon.TabList>
        <Carbon.TabPanels>
          <Carbon.TabPanel>Follow the layout grid and spacing scale.</Carbon.TabPanel>
          <Carbon.TabPanel>Import components from the self-hosted bundle.</Carbon.TabPanel>
        </Carbon.TabPanels>
      </Carbon.Tabs>
    ),
  },
  TabContent: {
    demo: (
      <Carbon.TabContent selected>
        <p>Token builds ship every release; components follow weekly.</p>
      </Carbon.TabContent>
    ),
  },
  Tag: {
    demo: (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Carbon.Tag type="blue">Design</Carbon.Tag>
        <Carbon.Tag type="green">Ready to build</Carbon.Tag>
        <Carbon.Tag type="red">Blocked</Carbon.Tag>
        <Carbon.Tag type="gray">Needs scope</Carbon.Tag>
      </div>
    ),
  },
  TextArea: {
    demo: (
      <Carbon.TextArea id="bd-change" labelText="Describe the change" helperText="One or two sentences for the changelog." placeholder="Bump tokens to v1.119." rows={4} onChange={() => {}} />
    ),
  },
  TextInput: {
    demo: (
      <Carbon.TextInput id="bd-workspace" labelText="Workspace name" helperText="Lowercase, no spaces." placeholder="bongdesign" onChange={() => {}} />
    ),
  },
  TimePickerSelect: {
    demo: (
      <Carbon.TimePicker id="bd-standup" labelText="Standup time" placeholder="hh:mm">
        <Carbon.TimePickerSelect id="bd-standup-tz">
          <Carbon.SelectItem value="cet" text="CET" />
          <Carbon.SelectItem value="utc" text="UTC" />
        </Carbon.TimePickerSelect>
      </Carbon.TimePicker>
    ),
  },
  Toggle: {
    demo: (
      <Carbon.Toggle id="bd-sso" labelText="Require SSO for editors" labelA="Off" labelB="On" defaultToggled onChange={() => {}} />
    ),
  },
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

function guideFor(name, entry) {
  if (entry && entry.doc && guidelines[entry.doc]) return guidelines[entry.doc];
  if (guidelines[name]) return guidelines[name];
  return null;
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
  const [selected, setSelected] = useState('Button');
  const { cards, byName } = useMemo(componentCards, []);
  const q = query.trim().toLowerCase();
  const shown = cards.filter((c) => c.name.toLowerCase().includes(q));
  const groups = {};
  for (const c of shown) {
    const g = category(c.name);
    (groups[g] = groups[g] || []).push(c);
  }
  const current = cards.find((c) => c.name === selected) || cards[0];
  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <aside style={{ flex: '0 0 13rem' }}>
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
            <div key={g} style={{ marginTop: '1.5rem' }}>
              <h5>{g}</h5>
              {groups[g].map((c) => (
                <div key={c.name}>
                  <Carbon.Link
                    href={`#${c.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelected(c.name);
                    }}
                  >
                    {c.name}
                  </Carbon.Link>
                </div>
              ))}
            </div>
          ))}
      </aside>
      <section style={{ flex: '1', minWidth: 0 }} data-demo={current.name}>
        <h3>{current.name}</h3>
        {current.live ? (
          <DemoBoundary key={current.name}>
            <div className="bong-demo-row">{current.demo}</div>
          </DemoBoundary>
        ) : (
          <p>{current.note}</p>
        )}
        {(() => {
          const g = guideFor(current.name, byName[current.name]);
          return (
            <Carbon.Tabs>
              <Carbon.TabList>
                <Carbon.Tab>Guidelines</Carbon.Tab>
                <Carbon.Tab>Specifications</Carbon.Tab>
                <Carbon.Tab>Code</Carbon.Tab>
                <Carbon.Tab>Accessibility</Carbon.Tab>
              </Carbon.TabList>
              <Carbon.TabPanels>
                <Carbon.TabPanel>
                  {g ? (
                    <ul>
                      {g.guidelines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Guidance for this entry is being written.</p>
                  )}
                </Carbon.TabPanel>
                <Carbon.TabPanel>
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
                </Carbon.TabPanel>
                <Carbon.TabPanel>
                  <pre style={{ overflowX: 'auto', background: '#f4f4f4', padding: '1rem' }}>
                    <code>{current.code}</code>
                  </pre>
                </Carbon.TabPanel>
                <Carbon.TabPanel>
                  {g ? (
                    <ul>
                      {g.a11y.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Accessibility notes for this entry are being written.</p>
                  )}
                </Carbon.TabPanel>
              </Carbon.TabPanels>
            </Carbon.Tabs>
          );
        })()}
      </section>
    </div>
  );
}
