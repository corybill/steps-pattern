/* eslint-disable steps-pattern/enforce-step-iterator-simplicity -- sequential Bedrock Titan embedContents batches (rate + heap); do not Promise.all */
for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE);
  const batchEmbeddings = await EmbeddingProxy.embedContents(
    batch.map((content) => ({ text: content, title: documentId })),
    { taskType: "RETRIEVAL_DOCUMENT" }
  );
  embeddedChunks.push(...zip(batch, batchEmbeddings));
}
/* eslint-enable steps-pattern/enforce-step-iterator-simplicity */
