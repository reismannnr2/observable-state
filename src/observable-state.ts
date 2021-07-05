import { Observable, Subject, Subscriber, TeardownLogic } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export interface ExtractState<T, P> {
  (state: T): P;
}
export interface MergeState<T, P> {
  (state: T, partial: P): T;
}
export interface UpdateState<T> {
  (state: T): T;
}

export class ObservableState<T> extends Observable<T> {
  private readonly inner$ = new Subject<T>();
  constructor(private state: T) {
    super();
  }
  private next(state: T): void {
    this.state = state;
    this.inner$.next(state);
  }

  /**
   * @deprecated
   * @param subscriber
   */
  _subscribe(subscriber: Subscriber<T>): TeardownLogic {
    const subscription = this.inner$._subscribe(subscriber);
    if (subscription && !subscription.closed) {
      subscriber.next(this.state);
    }
    return subscription;
  }

  update(action: UpdateState<T>): void {
    this.next(action(this.state));
  }

  get currentState(): T {
    return this.state;
  }

  partial$<P>(
    extract: ExtractState<T, P>,
    merge: MergeState<T, P>,
    pipe: (observable: Observable<P>) => Observable<P> = (o) => o,
  ): PartialState<P> {
    const upTo = (partial: P) => this.update((state) => merge(state, partial));
    const subscribe = (partial$: PartialState<P>) => {
      const subscription = pipe(
        this.inner$.pipe(map(extract)),
      ).subscribe((partial) => partial$.next(partial));
      return () => {
        subscription.unsubscribe();
      };
    };
    return new PartialState(extract(this.state), upTo, subscribe);
  }

  distinctPartial$<P>(
    extract: ExtractState<T, P>,
    merge: MergeState<T, P>,
    pipe: (observable: Observable<P>) => Observable<P> = (o) => o,
  ): PartialState<P> {
    return this.partial$(extract, merge, (o) =>
      pipe(o).pipe(distinctUntilChanged()),
    );
  }
}

export class PartialState<T> extends ObservableState<T> {
  private unsubscribe?: () => void;
  private upTo?: (partial: T) => void;

  constructor(
    state: T,
    upTo: (partial: T) => void,
    subscribe: (partial$: PartialState<T>) => () => void,
  ) {
    super(state);
    this.unsubscribe = subscribe(this);
    this.upTo = upTo;
  }

  update(action: UpdateState<T>): void {
    this.upTo && this.upTo(action(this.currentState));
  }

  close(): void {
    this.unsubscribe && this.unsubscribe();
    this.upTo = undefined;
    this.unsubscribe = undefined;
  }
}
