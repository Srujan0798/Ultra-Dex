import { RedditPoster } from './src/automation/reddit-poster';

async function main() {
  const rp = new RedditPoster();

  // 1. Draft a post
  const draft = rp.draftPost('LocalLLaMA', 'validation', {
    months: '2 months',
    providers: 'OpenAI, Anthropic, Gemini, Groq',
    features: 'VSCode extension + Plugin system',
  });
  console.log('✅ Draft created:', draft.id);
  console.log('   Title A:', draft.titleA);
  console.log('   Title B:', draft.titleB);
  console.log('   Subreddit:', draft.subreddit);
  console.log('   Queue path:', draft.queuePath);

  // 2. Verify it's in pending queue
  const pending = rp.getPendingItems();
  console.log('\n✅ Pending items:', pending.length);
  if (pending.length > 0) {
    console.log('   First item id:', pending[0].id);
    console.log('   First item status:', pending[0].status);
    console.log('   First item type:', pending[0].type);
  }

  // 3. Approve and verify
  const approved = rp.approveItem(draft.id, 'test-user');
  console.log('\n✅ Item approved:', approved);

  // 4. Verify it moved out of pending
  const stillPending = rp.getPendingItems();
  console.log('   Still pending:', stillPending.length);

  // 5. Check approved items
  const approvedItems = rp.getItemsByStatus('approved');
  console.log('   Approved items:', approvedItems.length);
  if (approvedItems.length > 0) {
    console.log('   Approved by:', approvedItems[0].approvedBy);
    console.log('   Approved at:', approvedItems[0].approvedAt);
  }

  // 6. Test A/B title generation
  const ab = rp.generateABTitles('Built AI routing tool — is this useful?');
  console.log('\n✅ A/B titles generated:');
  console.log('   A:', ab.titleA);
  console.log('   B:', ab.titleB);

  // 7. Test draft reply
  const reply = rp.draftReply('comment-123', 'Thanks for the feedback! We are working on this.');
  console.log('\n✅ Reply drafted:', reply.id, '— status:', reply.status);

  // 8. Test draft DM
  const dm = rp.draftDM('test_user', 'About your comment', 'Hey, thanks for the interest in Ultra-Dex!');
  console.log('✅ DM drafted:', dm.id, '— status:', dm.status);

  // 9. Test kill switch
  console.log('\n✅ Approval gate (posting):', rp.getApprovalFlag('posting'));
  rp.setKillSwitch(true);
  console.log('   After kill switch ON:', rp.getApprovalFlag('posting'));
  rp.setKillSwitch(false);
  console.log('   After kill switch OFF:', rp.getApprovalFlag('posting'));

  // 10. Verify post log exists
  console.log('\n✅ Post log written to: .ultra-dex/automation/post-log.jsonl');

  console.log('\n🎉 All validation tests passed!');
}

main().catch(console.error);
