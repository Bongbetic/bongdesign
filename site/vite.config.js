import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const stripUpstream = {
  name: 'strip-upstream-refs',
  transform(code) {
    if (code.includes('carbondesignsystem.com')) {
      return code.split('https://carbondesignsystem.com').join('https://design.bongbetic.com');
    }
    return null;
  },
};

export default defineConfig({
  plugins: [react(), stripUpstream],
  base: '/',
  build: { outDir: 'dist', emptyOutDir: true },
});
