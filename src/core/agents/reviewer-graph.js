// Copyright (c) 2026 Ultra-Dex
// Reviewer Graph - Code review and quality analysis graph

import { GraphUtils } from './graph-utils.js';

/**
 * ReviewerGraph
 * Manages code review and quality analysis workflows
 */
export class ReviewerGraph {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.reviews = new Map();
    this.issues = new Map();
    this.approvals = new Map();
  }

  /**
   * Add code element
   */
  addCodeElement(elementId, metadata = {}) {
    GraphUtils.addNode(this.graph, elementId, {
      type: 'code-element',
      ...metadata
    });
    return this;
  }

  /**
   * Add dependency between code elements
   */
  addCodeDependency(fromId, toId) {
    GraphUtils.addEdge(this.graph, fromId, toId, {
      type: 'code-dependency'
    });
    return this;
  }

  /**
   * Create review
   */
  createReview(reviewId, reviewer, metadata = {}) {
    this.reviews.set(reviewId, {
      id: reviewId,
      reviewer,
      createdAt: Date.now(),
      status: 'in-progress',
      ...metadata
    });
    return this;
  }

  /**
   * Add issue
   */
  addIssue(issueId, elementId, issue) {
    if (!this.issues.has(elementId)) {
      this.issues.set(elementId, []);
    }

    this.issues.get(elementId).push({
      id: issueId,
      severity: issue.severity || 'medium',
      message: issue.message,
      suggestedFix: issue.suggestedFix,
      timestamp: Date.now()
    });
  }

  /**
   * Get issues for element
   */
  getIssues(elementId) {
    return this.issues.get(elementId) || [];
  }

  /**
   * Approve element
   */
  approveElement(elementId, reviewer) {
    this.approvals.set(elementId, {
      approver: reviewer,
      timestamp: Date.now()
    });
  }

  /**
   * Is element approved
   */
  isApproved(elementId) {
    return this.approvals.has(elementId);
  }

  /**
   * Get review status
   */
  getReviewStatus(reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    const approved = Array.from(this.approvals.keys()).length;
    const totalElements = this.graph.nodes.size;
    const issuesCount = Array.from(this.issues.values())
      .reduce((sum, issues) => sum + issues.length, 0);

    return {
      ...review,
      elementsReviewed: approved,
      totalElements,
      issuesFound: issuesCount,
      percentComplete: totalElements > 0 ? (approved / totalElements) * 100 : 0
    };
  }

  /**
   * Generate review report
   */
  generateReport(reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    return {
      reviewId,
      reviewer: review.reviewer,
      createdAt: review.createdAt,
      elementsAnalyzed: this.graph.nodes.size,
      issuesFound: Array.from(this.issues.values())
        .reduce((sum, issues) => sum + issues.length, 0),
      approved: this.approvals.size,
      issues: Object.fromEntries(this.issues)
    };
  }
}

export default ReviewerGraph;
