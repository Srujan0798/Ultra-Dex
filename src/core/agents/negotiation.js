// Copyright (c) 2026 Ultra-Dex
// Negotiation - Agent negotiation and consensus building

import { EventEmitter } from 'events';

/**
 * Negotiation
 * Manages agent-to-agent negotiation and consensus
 */
export class Negotiation extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      maxRounds: options.maxRounds || 10,
      timeout: options.timeout || 30000,
      consensusThreshold: options.consensusThreshold || 0.8,
      ...options
    };
    this.sessions = new Map();
    this.proposals = new Map();
  }

  /**
   * Start negotiation
   */
  async startNegotiation(negotiationId, participants, agenda, options = {}) {
    const session = {
      id: negotiationId,
      participants,
      agenda,
      status: 'started',
      createdAt: Date.now(),
      rounds: 0,
      proposals: [],
      agreements: [],
      votingRecords: []
    };

    this.sessions.set(negotiationId, session);
    this.emit('negotiation.started', { negotiationId, participants });

    try {
      const result = await this.conductNegotiation(session, options);
      return result;
    } catch (error) {
      session.status = 'failed';
      this.emit('negotiation.failed', { negotiationId, error });
      throw error;
    }
  }

  /**
   * Conduct negotiation rounds
   */
  async conductNegotiation(session, options = {}) {
    while (session.rounds < this.config.maxRounds) {
      session.rounds++;

      this.emit('negotiation.round-start', { sessionId: session.id, round: session.rounds });

      // Gather proposals
      const proposals = await this.gatherProposals(session);
      session.proposals.push(...proposals);

      // Evaluate proposals
      const evaluations = await this.evaluateProposals(session, proposals);

      // Vote
      const votes = await this.conductVoting(session, proposals);
      session.votingRecords.push(votes);

      // Check for consensus
      const consensus = this.checkConsensus(votes);

      if (consensus.reached) {
        session.status = 'consensus-reached';
        session.agreements.push(consensus.agreement);
        this.emit('negotiation.consensus-reached', {
          sessionId: session.id,
          round: session.rounds,
          agreement: consensus.agreement
        });
        break;
      }

      this.emit('negotiation.round-end', {
        sessionId: session.id,
        round: session.rounds,
        consensus: false
      });

      await this.delay(100);
    }

    session.status = 'completed';
    session.completedAt = Date.now();

    return {
      sessionId: session.id,
      status: session.status,
      roundsNeeded: session.rounds,
      agreements: session.agreements
    };
  }

  /**
   * Gather proposals
   */
  async gatherProposals(session) {
    return session.participants.map(participant => ({
      proposedBy: participant,
      proposal: { preference: Math.random() },
      timestamp: Date.now()
    }));
  }

  /**
   * Evaluate proposals
   */
  async evaluateProposals(session, proposals) {
    return proposals.map(p => ({
      ...p,
      score: Math.random(),
      feasible: true
    }));
  }

  /**
   * Conduct voting
   */
  async conductVoting(session, proposals) {
    return {
      round: session.rounds,
      votes: session.participants.map(p => ({
        voter: p,
        votedFor: proposals[0].proposedBy,
        weight: 1
      }))
    };
  }

  /**
   * Check for consensus
   */
  checkConsensus(votes) {
    const voteWeights = new Map();

    for (const vote of votes.votes) {
      if (!voteWeights.has(vote.votedFor)) {
        voteWeights.set(vote.votedFor, 0);
      }
      voteWeights.set(vote.votedFor, voteWeights.get(vote.votedFor) + vote.weight);
    }

    const totalWeight = Array.from(voteWeights.values()).reduce((a, b) => a + b, 0);
    const maxVotes = Math.max(...voteWeights.values());
    const consensusPercentage = maxVotes / totalWeight;

    if (consensusPercentage >= this.config.consensusThreshold) {
      const winner = Array.from(voteWeights.entries())
        .sort((a, b) => b[1] - a[1])[0][0];

      return {
        reached: true,
        agreement: { consensusParticipant: winner, percentage: consensusPercentage }
      };
    }

    return { reached: false };
  }

  /**
   * Add proposal
   */
  addProposal(sessionId, proposal) {
    if (!this.proposals.has(sessionId)) {
      this.proposals.set(sessionId, []);
    }

    this.proposals.get(sessionId).push({
      ...proposal,
      timestamp: Date.now()
    });
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Negotiation;
