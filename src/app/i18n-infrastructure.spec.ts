/**
 * Phase 0 — i18n Infrastructure Tests
 *
 * These tests validate the Angular built-in i18n build pipeline configuration.
 * They test configuration artifacts (angular.json, tsconfig, etc.) that are
 * required for `ng build --localize` to produce per-locale bundles.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function readJsonWithComments(filePath: string): any {
  const raw = readFileSync(filePath, 'utf-8');
  // Strip single-line comments and block comments for tsconfig-style JSON
  const stripped = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');

describe('i18n Infrastructure — angular.json', () => {
  const angularJson = readJsonWithComments(resolve(projectRoot, 'angular.json'));
  const project = angularJson.projects['web-app-smart-palm'];

  it('0.2: should have i18n block with sourceLocale "es"', () => {
    expect(project.i18n).toBeDefined();
    expect(project.i18n.sourceLocale).toBe('es');
  });

  it('0.2: should have "en" as a target locale', () => {
    expect(project.i18n).toBeDefined();
    expect(project.i18n.locales).toBeDefined();
    expect(project.i18n.locales).toHaveProperty('en');
  });

  it('0.5: should have @angular/localize/init in polyfills', () => {
    const buildOptions = project.architect.build.options;
    expect(buildOptions.polyfills).toBeDefined();
    expect(buildOptions.polyfills).toContain('@angular/localize/init');
  });
});

describe('i18n Infrastructure — tsconfig', () => {
  it('0.4: should have @angular/localize in tsconfig.app.json types', () => {
    const tsconfigApp = readJsonWithComments(
      resolve(projectRoot, 'tsconfig.app.json'),
    );
    const types = tsconfigApp.compilerOptions?.types as string[] | undefined;
    expect(types).toBeDefined();
    expect(types).toContain('@angular/localize');
  });
});
