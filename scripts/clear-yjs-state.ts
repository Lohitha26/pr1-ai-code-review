/**
 * Script to clear corrupted Yjs state from sessions
 * Run with: npx tsx scripts/clear-yjs-state.ts
 */

import prisma from '../lib/prisma';

async function clearYjsState() {
  console.log('Clearing corrupted Yjs state from all sessions...');
  
  const result = await prisma.codeSession.updateMany({
    data: {
      yjsState: null,
      lastSnapshot: '',
    },
  });
  
  console.log(`✅ Cleared Yjs state from ${result.count} sessions`);
  console.log('Sessions will start fresh with empty documents.');
  
  await prisma.$disconnect();
}

clearYjsState().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
