"use client";

import { SpawnAgentDialog } from "./SpawnAgentDialog";
import { ModelSwitchDialog } from "./ModelSwitchDialog";

export function GlobalDialogs() {
  return (
    <>
      <SpawnAgentDialog />
      <ModelSwitchDialog />
    </>
  );
}
