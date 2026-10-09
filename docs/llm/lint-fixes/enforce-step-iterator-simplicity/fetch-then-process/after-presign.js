const docsWithUrls = await Promise.all(
  documents.map((doc) => {
    const rawDoc = doc.raw || doc;
    const storageKey = doc.storageKey;
    const companionKey = storageKey
      .replace("accounts/", "companions/")
      .replace(/\.[^.]+$/, ".md");

    return Promise.all([
      S3Proxy.getDownloadUrl(storageKey),
      S3Proxy.getDownloadUrl(companionKey)
    ])
      .then(([url, markdownUrl]) => ({ ...rawDoc, url, markdownUrl }))
      .catch((err) => {
        LoggerProxy.error("Failed to get download URL", { storageKey }, err);
        return { ...rawDoc, url: "#" };
      });
  })
);
state.setAccountDocuments(docsWithUrls);
