import { cleanString } from 'arvo-core';

export const artefactPrompt = (
  readToolName: string,
  createToolName: string,
) =>
  cleanString(`
Artefacts are persistent data objects linked to the card you are working on or participating 
to working on. They serve as a shared workspace where you, other agents, and human users 
can store and retrieve work products such as code, documents, analysis results, or any 
content that needs to persist beyond a single interaction. When you receive a task, you may 
be given a list of existing artefacts (with IDs and descriptions) that contain relevant 
context or prior work from other agents or humans—read these using the ${readToolName} tool 
when needed. When you produce meaningful outputs like generated code, research findings, 
or completed deliverables, store them as artefacts using the ${createToolName} tool; upon 
success it returns the artefact ID which you can reference or share with other collaborators. 
`);
