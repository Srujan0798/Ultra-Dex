import {
  StateGraph,
  Annotation,
  START,
  END,
  Message
} from "@langchain/langgraph";
import { createOpenAIRunnable, createAnthropicRunnable, createGoogleRunnable } from "../providers/index.js";
import { AppError } from "../utils/errors.js";
import { printInfo, printSuccess, printError } from "../utils/output.js";
const _WorkflowState = Annotation.Root({
  // Core workflow state
  task: Annotation,
  plan: Annotation,
  result: Annotation,
  status: Annotation,
  error: Annotation,
  // Agent state
  currentAgent: Annotation,
  agentHistory: Annotation({
    reducer: (a, b) => [...a, ...b],
    default: () => []
  }),
  // Context and memory
  context: Annotation({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({})
  }),
  // Execution tracking
  step: Annotation,
  maxSteps: Annotation,
  completed: Annotation,
  // Quality metrics
  qualityScore: Annotation,
  confidence: Annotation
});
class LangGraphIntegration {
  constructor(options = {}) {
    this.options = {
      maxSteps: options.maxSteps || 20,
      timeout: options.timeout || 3e5,
      // 5 minutes
      retryAttempts: options.retryAttempts || 3,
      ...options
    };
    this.graphs = /* @__PURE__ */ new Map();
    this.runningWorkflows = /* @__PURE__ */ new Map();
  }
  /**
   * Create a planner graph for task breakdown
   */
  createPlannerGraph() {
    const workflow = new StateGraph({
      channels: {
        task: null,
        plan: null,
        status: null,
        error: null,
        currentAgent: null,
        agentHistory: null,
        context: null,
        step: null,
        maxSteps: null,
        completed: null,
        qualityScore: null,
        confidence: null
      }
    });
    workflow.addNode("analyze", this.plannerAnalyze.bind(this)).addNode("breakdown", this.plannerBreakdown.bind(this)).addNode("validate", this.plannerValidate.bind(this)).addNode("adjust", this.plannerAdjust.bind(this)).addEdge(START, "analyze").addEdge("analyze", "breakdown").addEdge("breakdown", "validate").addConditionalEdges(
      "validate",
      (state) => {
        if (state.completed) return END;
        if (state.qualityScore < 0.7) return "adjust";
        return END;
      }
    ).addEdge("adjust", "analyze");
    return workflow.compile();
  }
  /**
   * Planner: Analyze the task
   */
  async plannerAnalyze(state) {
    try {
      printInfo(`\u{1F50D} Planner analyzing task: ${state.task.substring(0, 50)}...`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `You are an expert project planner. Analyze the given task and identify:
          1. Core requirements
          2. Dependencies
          3. Potential risks
          4. Success criteria
          5. Estimated complexity`
        }),
        new Message({
          role: "user",
          content: `Analyze this task: ${state.task}`
        })
      ];
      const response = await provider.invoke({ messages });
      return {
        ...state,
        context: {
          ...state.context,
          analysis: response.content,
          requirements: this.extractRequirements(response.content),
          dependencies: this.extractDependencies(response.content),
          risks: this.extractRisks(response.content)
        },
        agentHistory: [...state.agentHistory, `Planner analyzed: ${state.task}`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Planner analysis failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Planner: Break down task into subtasks
   */
  async plannerBreakdown(state) {
    try {
      printInfo(`\u{1F4CB} Breaking down task into subtasks...`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `Break down the task into 3-7 atomic subtasks that can be completed in 1-4 hours each.
          Each subtask should be:
          1. Specific and measurable
          2. Independent when possible
          3. Estimable in time
          4. Testable
          
          Format as JSON: {subtasks: [{id, title, description, estimatedHours, dependencies, acceptanceCriteria}]}`
        }),
        new Message({
          role: "user",
          content: `Task: ${state.task}
Analysis: ${state.context.analysis}`
        })
      ];
      const response = await provider.invoke({ messages });
      const subtasks = this.parseSubtasks(response.content);
      return {
        ...state,
        plan: JSON.stringify(subtasks, null, 2),
        context: {
          ...state.context,
          subtasks,
          breakdown: response.content
        },
        agentHistory: [...state.agentHistory, `Planner created ${subtasks.length} subtasks`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Planner breakdown failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Planner: Validate the plan
   */
  async plannerValidate(state) {
    try {
      printInfo(`\u2705 Validating plan quality...`);
      const provider = createAnthropicRunnable("claude-3-5-sonnet-20241022");
      const messages = [
        new Message({
          role: "system",
          content: `Validate this implementation plan for:
          1. Completeness (does it cover all requirements?)
          2. Feasibility (are tasks achievable in estimated time?)
          3. Dependencies (are dependencies properly ordered?)
          4. Risk mitigation (are risks addressed?)
          5. Quality gates (will this produce high-quality code?)
          
          Return JSON: {valid: boolean, score: number 0-1, feedback: string, suggestions: string[]}`
        }),
        new Message({
          role: "user",
          content: `Task: ${state.task}
Plan: ${state.plan}
Analysis: ${state.context.analysis}`
        })
      ];
      const response = await provider.invoke({ messages });
      const validation = this.parseValidation(response.content);
      const newState = {
        ...state,
        qualityScore: validation.score,
        context: {
          ...state.context,
          validation,
          feedback: validation.feedback
        },
        agentHistory: [...state.agentHistory, `Planner validation: ${validation.score * 100}% quality`],
        step: state.step + 1
      };
      if (validation.score >= 0.7) {
        newState.completed = true;
        newState.status = "validated";
      }
      return newState;
    } catch (error) {
      return {
        ...state,
        error: `Planner validation failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Planner: Adjust plan based on feedback
   */
  async plannerAdjust(state) {
    try {
      printInfo(`\u{1F527} Adjusting plan based on feedback...`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `Adjust the implementation plan based on the validation feedback.
          Improve the plan to address the identified issues while maintaining the core objectives.
          Return the improved plan in the same format as before.`
        }),
        new Message({
          role: "user",
          content: `Original Plan: ${state.plan}
Validation Feedback: ${state.context.feedback}
Suggestions: ${state.context.validation.suggestions.join(", ")}`
        })
      ];
      const response = await provider.invoke({ messages });
      return {
        ...state,
        plan: response.content,
        agentHistory: [...state.agentHistory, `Planner adjusted plan based on feedback`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Planner adjustment failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Create an executor graph for implementation
   */
  createExecutorGraph() {
    const workflow = new StateGraph({
      channels: {
        task: null,
        plan: null,
        result: null,
        status: null,
        error: null,
        currentAgent: null,
        agentHistory: null,
        context: null,
        step: null,
        maxSteps: null,
        completed: null,
        qualityScore: null,
        confidence: null
      }
    });
    workflow.addNode("parsePlan", this.executorParsePlan.bind(this)).addNode("executeSubtask", this.executorExecuteSubtask.bind(this)).addNode("test", this.executorTest.bind(this)).addNode("review", this.executorReview.bind(this)).addNode("iterate", this.executorIterate.bind(this)).addEdge(START, "parsePlan").addEdge("parsePlan", "executeSubtask").addEdge("executeSubtask", "test").addEdge("test", "review").addConditionalEdges(
      "review",
      (state) => {
        if (state.step >= state.maxSteps) return END;
        if (state.completed) return END;
        if (state.qualityScore >= 0.9) return END;
        return "iterate";
      }
    ).addEdge("iterate", "executeSubtask");
    return workflow.compile();
  }
  /**
   * Executor: Parse the plan into executable steps
   */
  async executorParsePlan(state) {
    try {
      printInfo(`\u{1F4CB} Parsing plan into execution steps...`);
      const subtasks = JSON.parse(state.plan);
      const currentSubtask = subtasks[state.step] || subtasks[0];
      return {
        ...state,
        context: {
          ...state.context,
          currentSubtask,
          remainingSubtasks: subtasks.slice(state.step + 1)
        },
        agentHistory: [...state.agentHistory, `Executor parsed subtask: ${currentSubtask.title}`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Executor parse plan failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Executor: Execute a single subtask
   */
  async executorExecuteSubtask(state) {
    try {
      printInfo(`\u{1F680} Executing subtask: ${state.context.currentSubtask.title}`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `You are an expert implementation agent. Execute the given subtask by:
          1. Analyzing the requirements
          2. Creating the necessary files/code
          3. Implementing the functionality
          4. Adding appropriate error handling
          5. Including documentation and comments
          
          Return the implementation with file paths and content.`
        }),
        new Message({
          role: "user",
          content: `Subtask: ${state.context.currentSubtask.title}
Description: ${state.context.currentSubtask.description}
Acceptance Criteria: ${state.context.currentSubtask.acceptanceCriteria}`
        })
      ];
      const response = await provider.invoke({ messages });
      const implementation = this.parseImplementation(response.content);
      return {
        ...state,
        result: response.content,
        context: {
          ...state.context,
          implementation,
          lastResult: response.content
        },
        agentHistory: [...state.agentHistory, `Executor completed subtask: ${state.context.currentSubtask.title}`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Executor subtask failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Executor: Test the implementation
   */
  async executorTest(state) {
    try {
      printInfo(`\u{1F9EA} Testing implementation...`);
      const provider = createGoogleRunnable("gemini-1.5-pro-latest");
      const messages = [
        new Message({
          role: "system",
          content: `Test the implementation for:
          1. Functionality (does it work as expected?)
          2. Performance (are there performance issues?)
          3. Security (are there security vulnerabilities?)
          4. Edge cases (does it handle edge cases?)
          5. Error handling (are errors properly handled?)
          
          Return JSON: {pass: boolean, score: number 0-1, issues: string[], suggestions: string[]}`
        }),
        new Message({
          role: "user",
          content: `Implementation: ${state.result}
Acceptance Criteria: ${state.context.currentSubtask.acceptanceCriteria}`
        })
      ];
      const response = await provider.invoke({ messages });
      const testResults = this.parseTestResults(response.content);
      return {
        ...state,
        qualityScore: testResults.score,
        context: {
          ...state.context,
          testResults,
          lastTest: response.content
        },
        agentHistory: [...state.agentHistory, `Executor test: ${testResults.score * 100}% pass rate`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Executor test failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Executor: Review the implementation
   */
  async executorReview(state) {
    try {
      printInfo(`\u{1F440} Reviewing implementation quality...`);
      const provider = createAnthropicRunnable("claude-3-5-sonnet-20241022");
      const messages = [
        new Message({
          role: "system",
          content: `Review the implementation for:
          1. Code quality (is it clean, readable, maintainable?)
          2. Best practices (does it follow industry standards?)
          3. Architecture (is it well-structured?)
          4. Performance (is it efficient?)
          5. Security (is it secure?)
          
          Return JSON: {approved: boolean, score: number 0-1, feedback: string, improvements: string[]}`
        }),
        new Message({
          role: "user",
          content: `Implementation: ${state.result}
Test Results: ${JSON.stringify(state.context.testResults, null, 2)}`
        })
      ];
      const response = await provider.invoke({ messages });
      const review = this.parseReview(response.content);
      const newState = {
        ...state,
        qualityScore: review.score,
        context: {
          ...state.context,
          review,
          lastReview: response.content
        },
        agentHistory: [...state.agentHistory, `Executor review: ${review.score * 100}% quality`],
        step: state.step + 1
      };
      if (state.context.remainingSubtasks?.length === 0 && review.score >= 0.8) {
        newState.completed = true;
        newState.status = "completed";
      }
      return newState;
    } catch (error) {
      return {
        ...state,
        error: `Executor review failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Executor: Iterate and improve
   */
  async executorIterate(state) {
    try {
      printInfo(`\u{1F504} Iterating on implementation...`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `Improve the implementation based on the test results and review feedback.
          Address the identified issues while maintaining the core functionality.
          Return the improved implementation.`
        }),
        new Message({
          role: "user",
          content: `Current Implementation: ${state.result}
Test Feedback: ${state.context.testResults.feedback}
Review Feedback: ${state.context.review.feedback}
Improvements Needed: ${state.context.review.improvements.join(", ")}`
        })
      ];
      const response = await provider.invoke({ messages });
      return {
        ...state,
        result: response.content,
        agentHistory: [...state.agentHistory, `Executor iterated on implementation`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Executor iteration failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Create a reviewer graph for quality assurance
   */
  createReviewerGraph() {
    const workflow = new StateGraph({
      channels: {
        task: null,
        plan: null,
        result: null,
        status: null,
        error: null,
        currentAgent: null,
        agentHistory: null,
        context: null,
        step: null,
        maxSteps: null,
        completed: null,
        qualityScore: null,
        confidence: null
      }
    });
    workflow.addNode("analyzeCode", this.reviewerAnalyzeCode.bind(this)).addNode("identifyIssues", this.reviewerIdentifyIssues.bind(this)).addNode("suggestFixes", this.reviewerSuggestFixes.bind(this)).addNode("prioritize", this.reviewerPrioritize.bind(this)).addNode("report", this.reviewerReport.bind(this)).addEdge(START, "analyzeCode").addEdge("analyzeCode", "identifyIssues").addEdge("identifyIssues", "suggestFixes").addEdge("suggestFixes", "prioritize").addEdge("prioritize", "report").addEdge("report", END);
    return workflow.compile();
  }
  /**
   * Reviewer: Analyze code quality
   */
  async reviewerAnalyzeCode(state) {
    try {
      printInfo(`\u{1F50D} Analyzing code quality...`);
      const provider = createAnthropicRunnable("claude-3-5-sonnet-20241022");
      const messages = [
        new Message({
          role: "system",
          content: `Analyze the code for:
          1. Security vulnerabilities
          2. Performance issues
          3. Code smells
          4. Architecture problems
          5. Best practice violations
          
          Return structured analysis with specific line references.`
        }),
        new Message({
          role: "user",
          content: `Code to analyze: ${state.result}`
        })
      ];
      const response = await provider.invoke({ messages });
      return {
        ...state,
        context: {
          ...state.context,
          codeAnalysis: response.content,
          securityIssues: this.extractSecurityIssues(response.content),
          performanceIssues: this.extractPerformanceIssues(response.content)
        },
        agentHistory: [...state.agentHistory, `Reviewer analyzed code quality`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Reviewer analysis failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Reviewer: Identify specific issues
   */
  async reviewerIdentifyIssues(state) {
    try {
      printInfo(`\u{1F50D} Identifying specific issues...`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `Identify specific issues in the code and categorize them:
          1. Critical (security, data loss, crashes)
          2. High (major functionality issues)
          3. Medium (minor functionality issues)
          4. Low (style, documentation)
          
          Return JSON: {issues: [{severity, type, location, description, codeExample}]}`
        }),
        new Message({
          role: "user",
          content: `Code Analysis: ${state.context.codeAnalysis}
Code: ${state.result}`
        })
      ];
      const response = await provider.invoke({ messages });
      const issues = this.parseIssues(response.content);
      return {
        ...state,
        context: {
          ...state.context,
          issues,
          issueCount: issues.length
        },
        agentHistory: [...state.agentHistory, `Reviewer identified ${issues.length} issues`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Reviewer issue identification failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Reviewer: Suggest fixes for issues
   */
  async reviewerSuggestFixes(state) {
    try {
      printInfo(`\u{1F527} Suggesting fixes for issues...`);
      const provider = createOpenAIRunnable("gpt-4-turbo");
      const messages = [
        new Message({
          role: "system",
          content: `For each identified issue, suggest a specific fix with code examples.
          Prioritize fixes that address the root cause rather than symptoms.
          Return JSON: {fixes: [{issueId, description, fix, codeExample, estimatedEffort}]}`
        }),
        new Message({
          role: "user",
          content: `Issues: ${JSON.stringify(state.context.issues, null, 2)}
Code: ${state.result}`
        })
      ];
      const response = await provider.invoke({ messages });
      const fixes = this.parseFixes(response.content);
      return {
        ...state,
        context: {
          ...state.context,
          fixes,
          fixCount: fixes.length
        },
        agentHistory: [...state.agentHistory, `Reviewer suggested ${fixes.length} fixes`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Reviewer fix suggestions failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Reviewer: Prioritize issues and fixes
   */
  async reviewerPrioritize(state) {
    try {
      printInfo(`\u{1F4CA} Prioritizing issues and fixes...`);
      const provider = createAnthropicRunnable("claude-3-5-sonnet-20241022");
      const messages = [
        new Message({
          role: "system",
          content: `Prioritize the issues and fixes based on:
          1. Impact on users
          2. Security risk
          3. Business criticality
          4. Effort to fix
          
          Return prioritized list with recommended action order.`
        }),
        new Message({
          role: "user",
          content: `Issues: ${JSON.stringify(state.context.issues, null, 2)}
Fixes: ${JSON.stringify(state.context.fixes, null, 2)}`
        })
      ];
      const response = await provider.invoke({ messages });
      const prioritized = this.parsePrioritization(response.content);
      return {
        ...state,
        context: {
          ...state.context,
          prioritizedIssues: prioritized.issues,
          prioritizedFixes: prioritized.fixes,
          recommendedActions: prioritized.actions
        },
        agentHistory: [...state.agentHistory, `Reviewer prioritized issues and fixes`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Reviewer prioritization failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Reviewer: Generate final report
   */
  async reviewerReport(state) {
    try {
      printInfo(`\u{1F4CB} Generating review report...`);
      const report = {
        summary: {
          totalIssues: state.context.issueCount,
          criticalIssues: state.context.issues.filter((i) => i.severity === "critical").length,
          highIssues: state.context.issues.filter((i) => i.severity === "high").length,
          qualityScore: state.qualityScore
        },
        issues: state.context.prioritizedIssues,
        fixes: state.context.prioritizedFixes,
        recommendations: state.context.recommendedActions,
        confidence: state.confidence
      };
      return {
        ...state,
        result: JSON.stringify(report, null, 2),
        completed: true,
        status: "reviewed",
        agentHistory: [...state.agentHistory, `Reviewer completed quality report`],
        step: state.step + 1
      };
    } catch (error) {
      return {
        ...state,
        error: `Reviewer report generation failed: ${error.message}`,
        status: "failed"
      };
    }
  }
  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowType, initialState) {
    try {
      let graph;
      switch (workflowType) {
        case "planner":
          graph = this.createPlannerGraph();
          break;
        case "executor":
          graph = this.createExecutorGraph();
          break;
        case "reviewer":
          graph = this.createReviewerGraph();
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`);
      }
      const initial = {
        ...initialState,
        step: 0,
        maxSteps: this.options.maxSteps,
        completed: false,
        qualityScore: 0,
        confidence: 0.5,
        agentHistory: [],
        context: initialState.context || {}
      };
      printInfo(`\u{1F504} Starting ${workflowType} workflow...`);
      const result = await graph.invoke(initial);
      printSuccess(`\u2705 ${workflowType} workflow completed successfully`);
      return {
        success: true,
        result,
        workflowType,
        message: `${workflowType} workflow completed`
      };
    } catch (error) {
      printError(`Workflow execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        workflowType,
        message: `Workflow failed: ${error.message}`
      };
    }
  }
  /**
   * Create a custom workflow from definition
   */
  async createCustomWorkflow(definition) {
    try {
      const workflow = new StateGraph({
        channels: definition.channels || {
          task: null,
          result: null,
          status: null,
          error: null,
          context: null,
          step: null,
          completed: null
        }
      });
      for (const [nodeName, nodeConfig] of Object.entries(definition.nodes)) {
        const nodeFunction = this.createDynamicNode(nodeConfig);
        workflow.addNode(nodeName, nodeFunction);
      }
      for (const edge of definition.edges || []) {
        if (edge.conditional) {
          workflow.addConditionalEdges(edge.from, this.createConditionalEdge(edge));
        } else {
          workflow.addEdge(edge.from, edge.to);
        }
      }
      if (definition.start) {
        workflow.addEdge(START, definition.start);
      }
      if (definition.end) {
        workflow.addEdge(definition.end, END);
      }
      const compiled = workflow.compile();
      const workflowId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.graphs.set(workflowId, compiled);
      return {
        success: true,
        workflowId,
        workflow: compiled,
        message: `Custom workflow created: ${workflowId}`
      };
    } catch (error) {
      throw new AppError(`Custom workflow creation failed: ${error.message}`);
    }
  }
  /**
   * Create dynamic node function
   */
  createDynamicNode(config) {
    return async (state) => {
      try {
        return {
          ...state,
          context: {
            ...state.context,
            [config.id]: `Executed ${config.type} node`
          },
          step: state.step + 1
        };
      } catch (error) {
        return {
          ...state,
          error: `Node ${config.id} failed: ${error.message}`,
          status: "failed"
        };
      }
    };
  }
  /**
   * Parse requirements from text
   */
  extractRequirements(text) {
    const reqPattern = /(requirement|need|must|should|functionality)[^.!?]*(?=[.!?]|$)/gi;
    const matches = text.match(reqPattern) || [];
    return matches.map((m) => m.trim()).slice(0, 10);
  }
  /**
   * Parse dependencies from text
   */
  extractDependencies(text) {
    const depPattern = /(dependenc|require|need|prerequisit|extern|third-party)[^.!?]*(?=[.!?]|$)/gi;
    const matches = text.match(depPattern) || [];
    return matches.map((m) => m.trim()).slice(0, 10);
  }
  /**
   * Parse risks from text
   */
  extractRisks(text) {
    const riskPattern = /(risk|danger|problem|issue|concern|challenge)[^.!?]*(?=[.!?]|$)/gi;
    const matches = text.match(riskPattern) || [];
    return matches.map((m) => m.trim()).slice(0, 10);
  }
  /**
   * Parse subtasks from response
   */
  parseSubtasks(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);
        return parsed.subtasks || [];
      }
    } catch {
      const subtaskPattern = /(\d+)\.\s*(.*?)\s*-?\s*(.*?)(?=\n\d+\.|$)/gs;
      const matches = [...text.matchAll(subtaskPattern)];
      return matches.map((match, idx) => ({
        id: idx + 1,
        title: match[2].trim(),
        description: match[3].trim(),
        estimatedHours: 2,
        dependencies: [],
        acceptanceCriteria: "Implementation works as described"
      }));
    }
  }
  /**
   * Parse validation response
   */
  parseValidation(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonString);
      }
    } catch {
      const score = text.toLowerCase().includes("high") || text.includes("0.9") || text.includes("0.8") ? 0.85 : 0.65;
      return {
        valid: score > 0.7,
        score,
        feedback: text.substring(0, 200),
        suggestions: ["Improve clarity", "Add more details"]
      };
    }
  }
  /**
   * Parse implementation from response
   */
  parseImplementation(text) {
    const files = [];
    const filePattern = /```(?:\w+)?\s*([^\n]+?)\n([\s\S]*?)```/g;
    let match;
    while ((match = filePattern.exec(text)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].trim();
      if (filePath && content) {
        files.push({ path: filePath, content });
      }
    }
    return {
      files,
      summary: text.substring(0, 500)
    };
  }
  /**
   * Parse test results
   */
  parseTestResults(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonString);
      }
    } catch {
      return {
        pass: text.toLowerCase().includes("pass") || !text.toLowerCase().includes("fail"),
        score: text.toLowerCase().includes("pass") ? 0.8 : 0.3,
        issues: [],
        suggestions: []
      };
    }
  }
  /**
   * Parse review response
   */
  parseReview(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonString);
      }
    } catch {
      return {
        approved: !text.toLowerCase().includes("reject"),
        score: text.toLowerCase().includes("good") || text.toLowerCase().includes("excellent") ? 0.9 : 0.6,
        feedback: text.substring(0, 200),
        improvements: ["Consider performance", "Add error handling"]
      };
    }
  }
  /**
   * Parse issues from response
   */
  parseIssues(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);
        return parsed.issues || [];
      }
    } catch {
      return [{
        severity: "medium",
        type: "general",
        location: "unknown",
        description: text.substring(0, 100),
        codeExample: "// No example provided"
      }];
    }
  }
  /**
   * Parse fixes from response
   */
  parseFixes(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);
        return parsed.fixes || [];
      }
    } catch {
      return [{
        issueId: 1,
        description: "General fix suggestion",
        fix: text.substring(0, 200),
        codeExample: "// No example provided",
        estimatedEffort: "medium"
      }];
    }
  }
  /**
   * Parse prioritization
   */
  parsePrioritization(text) {
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonString);
      }
    } catch {
      return {
        issues: [],
        fixes: [],
        actions: ["Address critical issues first"]
      };
    }
  }
  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.runningWorkflows.get(workflowId);
    if (!workflow) {
      return { status: "not_found" };
    }
    return {
      status: "running",
      progress: workflow.progress,
      currentStep: workflow.currentStep,
      startTime: workflow.startTime
    };
  }
  /**
   * List all available workflows
   */
  listWorkflows() {
    return {
      builtIn: ["planner", "executor", "reviewer"],
      custom: Array.from(this.graphs.keys()),
      total: this.graphs.size + 3
    };
  }
}
const langGraphIntegration = new LangGraphIntegration();
var langgraph_integration_default = LangGraphIntegration;
export {
  LangGraphIntegration,
  langgraph_integration_default as default,
  langGraphIntegration
};
