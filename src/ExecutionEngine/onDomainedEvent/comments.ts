import { InferVersionedArvoContract, VersionedArvoContract } from 'arvo-core';
import { humanApprovalContract } from '../../handlers/human.approval.contract.ts';
import { humanConversationContract } from '../../handlers/human.conversation.contract.ts';
import { SimplePermissionManager } from '@arvo-tools/agentic';

export const createHumanApprovalComment = (
  randomId: string,
  event: InferVersionedArvoContract<
    VersionedArvoContract<typeof humanApprovalContract, '1.0.0'>
  >['accepts'],
) => `
[${randomId}]

Request for approval by Agent: ${event.source}
      
---

${event.data.prompt}

---

**Please respond in the following format:**

\`\`\`markdown
!!${randomId}

No or Yes
\`\`\`

**By default, your input is inferred as 'No' and 
if both are present then, your input is inferred as 'Yes'**
`;

export const createHumanConversationComment = (
  randomId: string,
  event: InferVersionedArvoContract<
    VersionedArvoContract<typeof humanConversationContract, '1.0.0'>
  >['accepts'],
) => `
[${randomId}]

Comment by Agent: ${event.source}
      
---

${event.data.prompt}

---

**Please respond with** \`!!${randomId}\` **at the start of the response.**
    `;

export const createPermissionComment = (
  randomId: string,
  event: InferVersionedArvoContract<
    typeof SimplePermissionManager.VERSIONED_CONTRACT
  >['accepts'],
) => `
[${randomId}]

Request for permission by Agent: ${event.source}
      
---

${event.data.reason}

${event.data.requestedTools.join('\n - ')}

---

**Please respond in the following format:**

\`\`\`markdown
!!${randomId}

No or Yes
\`\`\`

**By default, your input is inferred as 'No' and 
if both are present then, your input is inferred as 'Yes'**
`;
