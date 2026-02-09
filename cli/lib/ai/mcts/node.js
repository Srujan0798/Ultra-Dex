// Copyright (c) 2026 Ultra-Dex
// v5.1 Cognitive Core: MCTS Node

import { v4 as uuidv4 } from 'uuid';

export class MCTSNode {
    constructor(state, parent = null, action = null) {
        this.id = uuidv4();
        this.state = state;       // The state of the world/plan at this node
        this.parent = parent;     // Parent node
        this.action = action;     // The action that led to this state
        this.children = [];       // Child nodes
        this.visits = 0;          // N: Number of times visited
        this.value = 0;           // Q: Total value (wins/score)
        this.untriedActions = []; // Actions that haven't been expanded yet
    }

    /**
     * Check if the node is a terminal state (success or failure)
     */
    isTerminal() {
        // In a real implementation, this checks if the plan is complete or failed
        return this.state.isTerminal;
    }

    /**
     * Check if the node is fully expanded (all children generated)
     */
    isFullyExpanded() {
        return this.untriedActions.length === 0 && this.children.length > 0;
    }

    /**
     * Select the best child using Upper Confidence Bound (UCB1)
     * UCB1 = (Q/N) + C * sqrt(ln(Parent_N) / N)
     */
    bestChild(c = 1.414) {
        let best = null;
        let bestScore = -Infinity;

        for (const child of this.children) {
            if (child.visits === 0) return child; // Prioritize unvisited

            const exploit = child.value / child.visits;
            const explore = c * Math.sqrt(Math.log(this.visits) / child.visits);
            const score = exploit + explore;

            if (score > bestScore) {
                bestScore = score;
                best = child;
            }
        }
        return best;
    }

    /**
     * Update stats during backpropagation
     */
    update(result) {
        this.visits++;
        this.value += result;
    }

    /**
     * Add a child node
     */
    addChild(childNode) {
        this.children.push(childNode);
        childNode.parent = this;
    }
}
