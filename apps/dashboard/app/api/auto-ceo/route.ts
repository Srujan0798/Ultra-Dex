import { NextResponse } from 'next/server';
import {
  readState,
  readSentimentReport,
  readScraperResults,
  readSchedulerJobs,
  readDraftPost,
  readDraftDM,
  approvePost,
  approveDM,
  overrideDecision,
  toggleKillSwitch,
} from '@/lib/auto-ceo-api';

export async function GET() {
  try {
    const [state, sentiment, scraper, scheduler, draftPost, draftDM] = await Promise.all([
      readState(),
      readSentimentReport(),
      readScraperResults(),
      readSchedulerJobs(),
      readDraftPost(),
      readDraftDM(),
    ]);

    return NextResponse.json({
      state,
      sentiment,
      scraper,
      scheduler,
      draftPost,
      draftDM,
    });
  } catch (error) {
    console.error('Error fetching AUTO-CEO data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    let result;
    switch (action) {
      case 'approvePost':
        result = await approvePost(payload.postId);
        break;
      case 'approveDM':
        result = await approveDM(payload.userId, payload.message);
        break;
      case 'overrideDecision':
        result = await overrideDecision(payload.decision);
        break;
      case 'toggleKillSwitch':
        result = await toggleKillSwitch(payload.enabled);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
