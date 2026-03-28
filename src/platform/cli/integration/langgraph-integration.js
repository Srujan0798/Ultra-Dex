import {
  StateGraph,
  START,
  END
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
class LangGraphIntegration {
  graph;
  nodes;
  edges;
  state;
  llmProviders;
  constructor() {
    this.nodes = /* @__PURE__ */ new Map();
    this.edges = [];
    this.state = {
      input: "",
      output: "",
      context: {},
      errors: [],
      completedNodes: [],
      currentStep: ""
    };
    this.llmProviders = /* @__PURE__ */ new Map();
  }
  /**
   * Initialize LLM providers
   */
  async initializeProviders(config) {
    if (config.openai) {
      this.llmProviders.set("openai", new ChatOpenAI({
        apiKey: config.openai,
        modelName: "gpt-4"
      }));
    }
    if (config.anthropic) {
      this.llmProviders.set("anthropic", new ChatAnthropic({
        apiKey: config.anthropic,
        modelName: "claude-3-opus-20240229"
      }));
    }
  }
  /**
   * Add a node to the graph
   */
  addNode(node) {
    this.nodes.set(node.id, node);
  }
  /**
   * Add an edge to the graph
   */
  addEdge(edge) {
    this.edges.push(edge);
  }
  /**
   * Create a planner node
   */
  createPlannerNode(id, config) {
    return {
      id,
      type: "planner",
      config: config || {},
      dependencies: []
    };
  }
  /**
   * Create an executor node
   */
  createExecutorNode(id, config) {
    return {
      id,
      type: "executor",
      config: config || {},
      dependencies: []
    };
  }
  /**
   * Create a reviewer node
   */
  createReviewerNode(id, config) {
    return {
      id,
      type: "reviewer",
      config: config || {},
      dependencies: []
    };
  }
  /**
   * Create a debugger node
   */
  createDebuggerNode(id, config) {
    return {
      id,
      type: "debugger",
      config: config || {},
      dependencies: []
    };
  }
  /**
   * Create an architect node
   */
  createArchitectNode(id, config) {
    return {
      id,
      type: "architect",
      config: config || {},
      dependencies: []
    };
  }
  /**
   * Execute a planner node
   */
  async executePlannerNode(node, state) {
    try {
      const llm = this.llmProviders.get(node.config.provider || "openai");
      if (!llm) {
        throw new Error(`No LLM provider configured for node ${node.id}`);
      }
      const messages = [
        new SystemMessage(`You are a project planner. Create a detailed plan for: ${state.input}`),
        new HumanMessage(state.input)
      ];
      const response = await llm.invoke(messages);
      state.context.plan = response.content;
      state.completedNodes.push(node.id);
      state.currentStep = node.id;
      return state;
    } catch (error) {
      state.errors.push(`Planner node ${node.id} failed: ${error.message}`);
      return state;
    }
  }
  /**
   * Execute an executor node
   */
  async executeExecutorNode(node, state) {
    try {
      const llm = this.llmProviders.get(node.config.provider || "openai");
      if (!llm) {
        throw new Error(`No LLM provider configured for node ${node.id}`);
      }
      const messages = [
        new SystemMessage(`You are a code executor. Implement the plan: ${state.context.plan}`),
        new HumanMessage(`Execute this plan and return the code: ${state.context.plan}`)
      ];
      const response = await llm.invoke(messages);
      state.output = response.content;
      state.completedNodes.push(node.id);
      state.currentStep = node.id;
      return state;
    } catch (error) {
      state.errors.push(`Executor node ${node.id} failed: ${error.message}`);
      return state;
    }
  }
  /**
   * Execute a reviewer node
   */
  async executeReviewerNode(node, state) {
    try {
      const llm = this.llmProviders.get(node.config.provider || "openai");
      if (!llm) {
        throw new Error(`No LLM provider configured for node ${node.id}`);
      }
      const messages = [
        new SystemMessage(`You are a code reviewer. Review the following code: ${state.output}`),
        new HumanMessage(`Review this code and provide feedback: ${state.output}`)
      ];
      const response = await llm.invoke(messages);
      state.context.review = response.content;
      state.completedNodes.push(node.id);
      state.currentStep = node.id;
      return state;
    } catch (error) {
      state.errors.push(`Reviewer node ${node.id} failed: ${error.message}`);
      return state;
    }
  }
  /**
   * Execute a debugger node
   */
  async executeDebuggerNode(node, state) {
    try {
      const llm = this.llmProviders.get(node.config.provider || "openai");
      if (!llm) {
        throw new Error(`No LLM provider configured for node ${node.id}`);
      }
      const messages = [
        new SystemMessage(`You are a debugger. Find and fix issues in the following code: ${state.output}`),
        new HumanMessage(`Debug this code and return fixes: ${state.output}`)
      ];
      const response = await llm.invoke(messages);
      state.output = response.content;
      state.completedNodes.push(node.id);
      state.currentStep = node.id;
      return state;
    } catch (error) {
      state.errors.push(`Debugger node ${node.id} failed: ${error.message}`);
      return state;
    }
  }
  /**
   * Execute an architect node
   */
  async executeArchitectNode(node, state) {
    try {
      const llm = this.llmProviders.get(node.config.provider || "openai");
      if (!llm) {
        throw new Error(`No LLM provider configured for node ${node.id}`);
      }
      const messages = [
        new SystemMessage(`You are a system architect. Design the architecture for: ${state.input}`),
        new HumanMessage(`Create architecture for: ${state.input}`)
      ];
      const response = await llm.invoke(messages);
      state.context.architecture = response.content;
      state.completedNodes.push(node.id);
      state.currentStep = node.id;
      return state;
    } catch (error) {
      state.errors.push(`Architect node ${node.id} failed: ${error.message}`);
      return state;
    }
  }
  /**
   * Execute a custom node
   */
  async executeCustomNode(node, state) {
    try {
      if (node.config.function) {
        state = await node.config.function(state);
      } else if (node.config.apiEndpoint) {
        const response = await axios.post(node.config.apiEndpoint, state);
        state = response.data;
      }
      state.completedNodes.push(node.id);
      state.currentStep = node.id;
      return state;
    } catch (error) {
      state.errors.push(`Custom node ${node.id} failed: ${error.message}`);
      return state;
    }
  }
  /**
   * Execute the entire graph
   */
  async executeGraph(initialState) {
    this.state = { ...initialState };
    const sortedNodes = this.topologicalSort();
    for (const nodeId of sortedNodes) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      const dependenciesSatisfied = node.dependencies.every(
        (dep) => this.state.completedNodes.includes(dep)
      );
      if (!dependenciesSatisfied) {
        this.state.errors.push(`Dependencies not satisfied for node ${nodeId}`);
        continue;
      }
      switch (node.type) {
        case "planner":
          this.state = await this.executePlannerNode(node, this.state);
          break;
        case "executor":
          this.state = await this.executeExecutorNode(node, this.state);
          break;
        case "reviewer":
          this.state = await this.executeReviewerNode(node, this.state);
          break;
        case "debugger":
          this.state = await this.executeDebuggerNode(node, this.state);
          break;
        case "architect":
          this.state = await this.executeArchitectNode(node, this.state);
          break;
        case "custom":
          this.state = await this.executeCustomNode(node, this.state);
          break;
        default:
          this.state.errors.push(`Unknown node type: ${node.type}`);
      }
      const shouldContinue = this.checkConditions(nodeId);
      if (!shouldContinue) {
        break;
      }
    }
    return this.state;
  }
  /**
   * Topological sort of nodes
   */
  topologicalSort() {
    const visited = /* @__PURE__ */ new Set();
    const result = [];
    const temp = /* @__PURE__ */ new Set();
    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      if (temp.has(nodeId)) throw new Error("Circular dependency detected");
      temp.add(nodeId);
      const node = this.nodes.get(nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }
      temp.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId);
    };
    for (const [nodeId] of this.nodes) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    return result;
  }
  /**
   * Check conditions for continuing execution
   */
  checkConditions(nodeId) {
    const edges = this.edges.filter((edge) => edge.from === nodeId);
    for (const edge of edges) {
      if (edge.condition) {
        return edge.condition(this.state);
      }
    }
    return true;
  }
  /**
   * Create a state graph using LangGraph
   */
  async createStateGraph(nodes, edges) {
    const workflow = new StateGraph({
      channels: {
        input: null,
        output: null,
        context: null,
        errors: null,
        completedNodes: null,
        currentStep: null
      }
    });
    for (const node of nodes) {
      workflow.addNode(node.id, async (state) => {
        const currentState = { ...state };
        switch (node.type) {
          case "planner":
            return await this.executePlannerNode(node, currentState);
          case "executor":
            return await this.executeExecutorNode(node, currentState);
          case "reviewer":
            return await this.executeReviewerNode(node, currentState);
          case "debugger":
            return await this.executeDebuggerNode(node, currentState);
          case "architect":
            return await this.executeArchitectNode(node, currentState);
          case "custom":
            return await this.executeCustomNode(node, currentState);
          default:
            return currentState;
        }
      });
    }
    for (const edge of edges) {
      workflow.addEdge(edge.from, edge.to);
    }
    workflow.addEdge(START, nodes[0]?.id || "start");
    workflow.addEdge(nodes[nodes.length - 1]?.id || "end", END);
    return workflow.compile();
  }
  /**
   * Execute a complex workflow
   */
  async executeWorkflow(input, workflowConfig) {
    const initialState = {
      input,
      output: "",
      context: {},
      errors: [],
      completedNodes: [],
      currentStep: "start"
    };
    const graph = await this.createStateGraph(workflowConfig.nodes, workflowConfig.edges);
    const result = await graph.invoke(initialState);
    return result;
  }
  /**
   * Get graph visualization
   */
  getGraphVisualization() {
    return {
      nodes: Array.from(this.nodes.values()).map((node) => ({
        id: node.id,
        type: node.type,
        completed: this.state.completedNodes.includes(node.id)
      })),
      edges: this.edges,
      state: this.state
    };
  }
  /**
   * Save graph to file
   */
  saveGraph(filePath) {
    const graphData = {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      state: this.state
    };
    writeFileSync(filePath, JSON.stringify(graphData, null, 2));
  }
  /**
   * Load graph from file
   */
  loadGraph(filePath) {
    const graphData = JSON.parse(readFileSync(filePath, "utf8"));
    this.nodes.clear();
    for (const node of graphData.nodes) {
      this.nodes.set(node.id, node);
    }
    this.edges = graphData.edges;
    this.state = graphData.state;
  }
}
var langgraph_integration_default = LangGraphIntegration;
export {
  LangGraphIntegration,
  langgraph_integration_default as default
};
