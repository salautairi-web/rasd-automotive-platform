import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import type { CustomerActor } from "../customerSessions";
import { CUSTOMER_SESSION_COOKIE, resolveCustomerSession } from "../customerSessions";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  customer: CustomerActor | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let customer: CustomerActor | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Customer authentication is explicitly independent from the OAuth employee session.
  // Only attempt the database lookup when the dedicated cookie is present.
  if (typeof opts.req.headers.cookie === "string" && opts.req.headers.cookie.split(";").some(part => part.trim().startsWith(`${CUSTOMER_SESSION_COOKIE}=`))) {
    customer = await resolveCustomerSession(opts.req);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    customer,
  };
}
