import { createSimpleArvoContract } from 'arvo-core';
import z from 'zod';
import { cleanString } from 'arvo-core';

export const humanConversationContract = createSimpleArvoContract({
  uri: '#/kanban/amas/external/human/conversation',
  type: 'human.conversation',
  domain: 'human.interaction',
  description: cleanString(`
    A mechanism through which the agent can reach out to the human during 
    task execution to initiate a conversation. Once initiated by the agent, 
    the human can respond and continue the conversation for as long as needed. 
    This enables back-and-forth dialogue for clarification, additional input, 
    or confirmation before the agent provides the final answer.  
  `),
  versions: {
    '1.0.0': {
      accepts: z.object({
        prompt: z.string().describe(
          'The question or message from the agent to the human user that initiates or continues the conversation',
        ),
      }),
      emits: z.object({
        response: z.string().describe(
          "The human user's response that continues the dialogue and provides the requested information, feedback, or further questions",
        ),
      }),
    },
  },
});
