const docsWithUrls = await Promise.all(
  documents.map(async (doc) => {
    const rawDoc = doc.raw || doc;
    const storageKey = doc.storageKey;
    const companionKey = storageKey
      .replace("accounts/", "companions/")
      .replace(/\.[^.]+$/, ".md");
    return {
      ...rawDoc,
      url: await S3Proxy.getDownloadUrl(storageKey),
      markdownUrl: await S3Proxy.getDownloadUrl(companionKey)
    };
  })
);
