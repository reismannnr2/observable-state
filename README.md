# observable-state

## install

```
npm install --save @reismannnr2/observable-state
```

## usage

```typescript
import { ObservableState } from './observable-state';

const initialState = { s: '', n: 5 }
const state$ = new ObservableState(initialState);
state$.update(prev => ({...prev, s: 'updated'}));
assert(state$.currentState.s === 'updated');
assert(state$.currentState.n === 5);

const partial$ = state$.partial$(state => state.n, (state, n) => ({...state, n}));
partial$.update(n => n * 2);
assert(state$.currentState.n === 10);
assert(partial$.currentState === 10);
assert(state$.currentState !== initialState);
```
