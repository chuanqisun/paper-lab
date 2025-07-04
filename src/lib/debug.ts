export function debug(name: string) {
  return (value: any) => {
    console.log(`[${name}]`, value);
    return value;
  };
}

debug.on = debug;
debug.off = (_name: string) => {
  return () => {};
};
