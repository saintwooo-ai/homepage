/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3C-3 adapter factory boundary.
 * The future local cron reader is intentionally not implemented here. A blocked
 * or unknown source returns the disabled adapter; fixture remains the default.
 */

import type { WorkConsoleDataAdapter } from '../../types/workConsole';
import { liveHermesWorkConsoleAdapter } from './liveHermesWorkConsoleAdapter';
import { mockWorkConsoleAdapter } from './mockAdapter';
import { evaluateWorkConsoleRuntimeGate, type WorkConsoleRuntimeGateDecision, type WorkConsoleRuntimeGateInput } from './runtimeGate';

export interface WorkConsoleAdapterFactoryResult {
  adapter: WorkConsoleDataAdapter;
  gate: WorkConsoleRuntimeGateDecision;
}

export const createWorkConsoleAdapter = (
  input: WorkConsoleRuntimeGateInput = {},
): WorkConsoleAdapterFactoryResult => {
  const gate = evaluateWorkConsoleRuntimeGate(input);

  if (gate.adapterKind === 'fixture') {
    return { adapter: mockWorkConsoleAdapter, gate };
  }

  return { adapter: liveHermesWorkConsoleAdapter, gate };
};

export const getDefaultWorkConsoleAdapter = (): WorkConsoleAdapterFactoryResult => createWorkConsoleAdapter({
  source: 'fixture',
  runtimeMode: 'unknown',
});
