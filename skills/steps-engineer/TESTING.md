# Check 3: RemixScenario Validation

We use `RemixScenario` to validate that the data coming from the server is actually loading into the UI as expected.

## Rules
- In UI tests, verify that `RemixScenario` is used to validate that the data coming from the server is actually loading into the UI as expected.
- Ensure at a minimum that 99% of the data points received from the server are validated as showing up in the UI.
- Every event trigger for every fetcher must have an explicit set of Scenario tests validating that data flows all the way to the correct mocked layer (module, repo, proxy).
