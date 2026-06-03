import type { TraceEvent, TracerOptions, TraceLevel, Tracer as TracerInterface } from '../types.js';

type PartialEvent = Partial<TraceEvent> & Pick<TraceEvent, 'traceId' | 'level' | 'type'>;

export class Tracer implements TracerInterface {
  captureContext: boolean | 'before' | 'after' | 'both';
  /** @internal used by Domain and Pipeline to generate traceIds */
  readonly _idFactory: () => string;

  private readonly _enabled: boolean;
  private readonly _maxEvents: number;
  private readonly _clock: () => number;
  private readonly _onSubscriberError?: (error: unknown) => void;
  private _events: TraceEvent[];
  private _subscribers: Set<(event: TraceEvent) => void>;
  private _droppedBoundaryAdded: boolean;

  constructor(options: TracerOptions = {}) {
    const {
      enabled = true,
      captureContext = false,
      maxEvents = 1000,
      clock = () => Date.now(),
      idFactory = () => crypto.randomUUID(),
      onSubscriberError,
    } = options;

    this.captureContext = captureContext;
    this._enabled = enabled;
    this._maxEvents = maxEvents;
    this._clock = clock;
    this._idFactory = idFactory;
    this._onSubscriberError = onSubscriberError;
    this._events = [];
    this._subscribers = new Set();
    this._droppedBoundaryAdded = false;
  }

  record(partial: PartialEvent): TraceEvent | undefined {
    if (!this._enabled) return undefined;

    if (this._events.length >= this._maxEvents) {
      if (!this._droppedBoundaryAdded) {
        this._droppedBoundaryAdded = true;
        const boundary: TraceEvent = {
          id: this._idFactory(),
          traceId: partial.traceId ?? 'boundary',
          timestamp: this._clock(),
          level: (partial.level ?? 'domain') as TraceLevel,
          type: 'events-dropped',
          status: 'failed',
          metadata: { dropped: true },
        };
        this._events.push(boundary);
        this._notifySubscribers(boundary);
      }
      return undefined;
    }

    const event = this._buildEvent(partial);
    this._events.push(event);
    this._notifySubscribers(event);
    return event;
  }

  private _buildEvent(partial: PartialEvent): TraceEvent {
    const event = { ...(partial as TraceEvent) };
    if (!event.id) event.id = this._idFactory();
    event.timestamp = this._clock();

    // Strip contextSnapshot if captureContext is false
    if (!this.captureContext) {
      delete event.contextSnapshot;
    }

    return event;
  }

  private _notifySubscribers(event: TraceEvent): void {
    for (const listener of this._subscribers) {
      try {
        listener(event);
      } catch (err) {
        if (this._onSubscriberError) {
          try { this._onSubscriberError(err); } catch {}
        }
      }
    }
  }

  subscribe(listener: (event: TraceEvent) => void): () => void {
    this._subscribers.add(listener);
    return () => this._subscribers.delete(listener);
  }

  history(): TraceEvent[] {
    return [...this._events];
  }

  traces(): string[] {
    return [...new Set(this._events.map(e => e.traceId))];
  }

  byTraceId(id: string): TraceEvent[] {
    return this._events.filter(e => e.traceId === id);
  }

  clear(): void {
    this._events = [];
    this._droppedBoundaryAdded = false;
  }

  export(format: 'json' | 'text' | 'tree'): unknown {
    switch (format) {
      case 'json': return [...this._events];
      case 'text': return this._events
        .map(e => {
          const sub = e.nodeId ?? e.phaseId;
          const scope = (e.domainId ?? e.pipelineId ?? '?') + (sub ? `/${sub}` : '');
          return `[${fmtTime(e.timestamp)}] [${scope}] ${e.type}${e.event ? ' "' + e.event + '"' : ''}`;
        })
        .join('\n');
      case 'tree': return buildTree(this._events);
      default: return [...this._events];
    }
  }
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

type TreeNode = TraceEvent & { children: TreeNode[] };

function buildTree(events: TraceEvent[]): TreeNode[] {
  const map = new Map<string, TreeNode>(
    events.map(e => [e.id, { ...e, children: [] }])
  );
  const roots: TreeNode[] = [];

  for (const event of map.values()) {
    if (event.parentId && map.has(event.parentId)) {
      map.get(event.parentId)!.children.push(event);
    } else {
      roots.push(event);
    }
  }

  return roots;
}

export function createTracer(options?: TracerOptions): Tracer {
  return new Tracer(options);
}
