const deniedKeys = ['forwarded', '-ip', 'remote-', 'via', '-user']

/** Preserve Sentry 10's restrictive data-collection defaults on the server. */
export const serverSentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: deniedKeys },
    response: { deny: deniedKeys },
  },
  httpBodies: [],
  urlQueryParams: { deny: deniedKeys },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
}
