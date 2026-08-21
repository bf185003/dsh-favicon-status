/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-favicon-status`.
 * @module @deepseek-ai/dsh-client-ui-favicon-status/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-favicon-status';
/** Cordis companion plugin name. */
export const name = 'client-ui-favicon-status-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: a pure-presentation plugin whose only side effect is
 * the document favicon link, derived from the sessions list store's byId
 * projection; the derivation, painting, and teardown behavior are asserted
 * directly by this package's specs.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map