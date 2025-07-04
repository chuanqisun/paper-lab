import { html as litHtml, type TemplateResult } from "lit-html";
import { Observable, isObservable } from "rxjs";
import { observe } from "./observe";

export type TemplateValue = Parameters<typeof litHtml>[1] | Observable<any>;
export const html = (strings: TemplateStringsArray, ...values: TemplateValue[]): TemplateResult => {
  const processedValues = values.map((value) => (isObservable(value) ? observe(value) : value));
  return litHtml(strings, ...processedValues);
};
