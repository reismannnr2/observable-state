import { ObservableState } from 'src/observable-state';

describe('ObservableState<T>', () => {
  const initialState = { s: 'str', n: 5 };
  const state$ = new ObservableState(initialState);
  test('update()', () => {
    let called = false;
    const subscription = state$.subscribe((current) => {
      if (!called) {
        called = true;
        return;
      }
      expect(current.s).toBe(10);
    });
    state$.update((state) => ({ s: state.s, n: state.n * 2 }));
    expect(state$.currentState).not.toBe(initialState);
    subscription.unsubscribe();
  });
});

describe('PartialState<P>', () => {
  const initialState = { s: 'str', n: 5 };
  const state$ = new ObservableState(initialState);
  test('partial$()', () => {
    expect.assertions(6);
    const partial$ = state$.distinctPartial$(
      (state) => state.n,
      (state, n) => ({ ...state, n }),
    );
    let called = false;
    const subscription = partial$.subscribe((n) => {
      if (!called) {
        called = true;
        return;
      }
      expect(n).toBe(10);
    });
    partial$.update((n) => n * 2);
    expect(state$.currentState.s).toBe('str');
    expect(state$.currentState.n).toBe(10);
    expect(state$.currentState).not.toBe(initialState);
    state$.update((state) => ({ ...state, s: 'updated' }));
    partial$.close();
    partial$.update((n) => n * 3);
    subscription.unsubscribe();

    const s$ = state$.partial$(
      (state) => state.s,
      (state, s) => ({ ...state, s }),
    );
    s$.update((s) => `${s}-${s}`);
    expect(state$.currentState).not.toBe(initialState);
    expect(state$.currentState.s).toBe('updated-updated');
  });
});
