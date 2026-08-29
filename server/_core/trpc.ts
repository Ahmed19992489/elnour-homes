import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
6: const t = initTRPC.context<TrpcContext>().create({

transformer: superjson,
});
10: export const router = t.router;

export const publicProcedure = t.procedure;
13: const requireUser = t.middleware(async opts => {

const { ctx, next } = opts;
16:   if (!ctx.user) {

throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
}
20:   return next({

ctx: {
...ctx,
user: ctx.user,
},
});
});
28: export const protectedProcedure = t.procedure.use(requireUser);

30: export const adminProcedure = t.procedure.use(
export const adminProcedure = t.procedure.use(
t.middleware(async opts => {
const { ctx, next } = opts;
34:     if (!ctx.user || ctx.user.role !== 'admin') {
    if (!ctx.user || ctx.user.role !== 'admin') {
throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
}
38:     return next({
    return next({
ctx: {
...ctx,
user: ctx.user,
},
});
}),
);
The above content shows the entire, complete file contents of the requested file.
export const staffProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'moderator')) {
      throw new TRPCError({ code: "FORBIDDEN", message: "متاح للإدارة وفريق العمل فقط" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
