export const reducerPipe = <S, I>(reducers: ((state: S, intent: I) => S)[]): ((state: S, intent: I) => S) => {
  return (state: S, intent: I): S => {
    return reducers.reduce((currentState, reducer) => reducer(currentState, intent), state);
  };
};

export const tapPipe = <T>(fns: ((value: T) => void)[]): ((value: T) => T) => {
  return (value: T): T => {
    fns.forEach((fn) => fn(value));
    return value;
  };
};
