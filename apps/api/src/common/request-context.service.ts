import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

export type RequestContext = {
  tenantId?: string;
  isSuperAdmin?: boolean;
  userId?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run(context: RequestContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  get(): RequestContext | undefined {
    return this.storage.getStore();
  }
}
