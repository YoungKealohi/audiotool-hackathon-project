export function createConnectTransport(..._args: unknown[]): never {
  throw new Error(
    '@connectrpc/connect-node is not available in browser builds. Use @connectrpc/connect-web transport.',
  );
}
