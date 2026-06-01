export class PlexisError extends Error {
  code: string;
  domainId?: string;
  pipelineId?: string;
  nodeId?: string;
  context?: unknown;

  constructor(
    message: string,
    { code, domainId, pipelineId, nodeId, context }: {
      code: string;
      domainId?: string;
      pipelineId?: string;
      nodeId?: string;
      context?: unknown;
    } = { code: '' }
  ) {
    super(message);
    this.name = 'PlexisError';
    this.code = code;
    if (domainId !== undefined) this.domainId = domainId;
    if (pipelineId !== undefined) this.pipelineId = pipelineId;
    if (nodeId !== undefined) this.nodeId = nodeId;
    if (context !== undefined) this.context = context;
    const captureStackTrace = (Error as unknown as { captureStackTrace?: (t: object, c: Function) => void }).captureStackTrace;
    if (captureStackTrace) captureStackTrace(this, new.target);
  }

  static unknownEvent(domainId: string, state: string, event: string): PlexisError {
    return new PlexisError(
      `Unknown event "${event}" in state "${state}" for domain "${domainId}"`,
      { code: 'UNKNOWN_EVENT', domainId }
    );
  }

  static stateMismatch(domainId: string, expected: string, actual: string): PlexisError {
    return new PlexisError(
      `Domain "${domainId}" expected state "${expected}" but is in "${actual}"`,
      { code: 'STATE_MISMATCH', domainId, context: { expected, actual } }
    );
  }

  static unknownInitialState(domainId: string, state: string): PlexisError {
    return new PlexisError(
      `Domain "${domainId}" initial state "${state}" does not exist`,
      { code: 'UNKNOWN_INITIAL_STATE', domainId }
    );
  }

  static unknownInitialNode(pipelineId: string, nodeId: string): PlexisError {
    return new PlexisError(
      `Pipeline "${pipelineId}" initial node "${nodeId}" does not exist`,
      { code: 'UNKNOWN_INITIAL_NODE', pipelineId }
    );
  }

  static unknownTargetState(domainId: string, fromState: string, event: string, target: string): PlexisError {
    return new PlexisError(
      `Domain "${domainId}" edge "${event}" from "${fromState}" targets unknown state "${target}"`,
      { code: 'UNKNOWN_TARGET_STATE', domainId }
    );
  }

  static unknownTargetNode(pipelineId: string, fromNode: string, target: string): PlexisError {
    return new PlexisError(
      `Pipeline "${pipelineId}" fork from "${fromNode}" targets unknown node "${target}"`,
      { code: 'UNKNOWN_TARGET_NODE', pipelineId, nodeId: fromNode }
    );
  }

  static unknownNode(id: string, nodeId: string): PlexisError {
    return new PlexisError(
      `Unknown node "${nodeId}" in "${id}"`,
      { code: 'UNKNOWN_NODE' }
    );
  }

  static builderClosed(helperName: string): PlexisError {
    return new PlexisError(
      `"${helperName}()" was called outside an active defineDomain or definePipeline setup scope. Setup functions must be synchronous.`,
      { code: 'BUILDER_CLOSED' }
    );
  }

  static duplicateRegistration(event: string, helper: string): PlexisError {
    return new PlexisError(
      `on('${event}') — ${helper}() was already registered for this handler. Each on() accepts a single ${helper}.`,
      { code: 'DUPLICATE_REGISTRATION' }
    );
  }

  static missingTarget(event: string): PlexisError {
    return new PlexisError(
      `on('${event}') — setup function did not return a target(). Use return target('state-id') as the last statement of the on() setup function.`,
      { code: 'MISSING_TARGET' }
    );
  }
}
