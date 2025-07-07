export const reducerPipe = <S, I>(reducers: ((state: S, intent: I) => S)[]): ((state: S, intent: I) => S) => {
  return (state: S, intent: I): S => {
    return reducers.reduce((currentState, reducer) => reducer(currentState, intent), state);
  };
};
