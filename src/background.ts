namespace Background {
  chrome.scripting.getRegisteredContentScripts(
    { ids: ["testing-scripts-gen"] },
    async (scripts) => {
      if (scripts && scripts.length) {
        await chrome.scripting.unregisterContentScripts({
          ids: ["testing-scripts-gen"],
        });
      }
      chrome.scripting.registerContentScripts([
        {
          id: "testing-scripts-gen",
          js: ["./inject.js"],
          matches: ["<all_urls>"],
          runAt: "document_start",
          allFrames: true,
        },
      ]);
    }
  );
}
