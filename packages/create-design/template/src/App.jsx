import React, { useState } from 'react';
import { BongbeticHeader, Button, HeaderGlobalAction, HeaderGlobalBar, Theme } from '@bongbetic/design';

export default function App() {
  const [dark, setDark] = useState(false);
  return (
    <Theme theme={dark ? 'g100' : 'white'}>
      <BongbeticHeader productName="__NAME__">
        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label="Toggle theme" onClick={() => setDark(!dark)}>
            {dark ? '☀' : '☾'}
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </BongbeticHeader>
      <main style={{ background: 'var(--cds-background)', color: 'var(--cds-text-primary)', minHeight: '100vh' }}>
        <h1>__NAME__</h1>
        <p>Built on the Bongbetic design system, installed from git.bongbetic.com.</p>
        <Button>Primary action</Button>
      </main>
    </Theme>
  );
}
