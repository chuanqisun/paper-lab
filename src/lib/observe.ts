import { noChange } from "lit-html";
import { AsyncDirective, directive } from "lit-html/async-directive.js";
import type { Observable, Subscription } from "rxjs";
export class ObserveDirective extends AsyncDirective {
  private unsubscribe?: () => void;
  private observable?: Observable<unknown>;

  render(observable: Observable<unknown>): typeof noChange {
    if (this.observable !== observable) {
      this.unsubscribe?.();
      this.observable = observable;
      if (this.isConnected) {
        this.subscribe(observable);
      }
    }
    return noChange;
  }

  private subscribe(obs: Observable<unknown>) {
    const sub: Subscription = obs.subscribe((value) => {
      this.setValue(value);
    });
    this.unsubscribe = () => sub.unsubscribe();
  }

  disconnected() {
    this.unsubscribe?.();
  }

  reconnected() {
    if (this.observable) {
      this.subscribe(this.observable);
    }
  }
}

export const observe = directive(ObserveDirective);
