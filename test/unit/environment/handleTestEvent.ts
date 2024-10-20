/*
In custom environment:

The class may optionally expose an asynchronous handleTestEvent method to bind to events fired by jest-circus. Normally, jest-circus test runner would pause until a promise returned from handleTestEvent gets fulfilled, except for the next events: `start_describe_definition`, `finish_describe_definition`, `add_hook`, `add_test` or `error` (for the up-to-date list you can look at SyncEvent type in the types definitions). That is caused by backward compatibility reasons and process.on('unhandledRejection', callback) signature, but that usually should not be a problem for most of the use cases.

Interesting events:

test_skip
test_todo
Also has 'setup' and 'teardown' events

Would be nice to list all skipped tests at end of test output. Runs in the context of the custom environment it's included in.
*/
/*
environment {
  async handleTestEvent(event, state) {
    if (event.name === 'setup') {
      // ...
    }
  }
}
*/