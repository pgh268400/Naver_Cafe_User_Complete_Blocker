namespace Background {
  // 컨텐츠 스크립트 등록을 위해 작동하는 백그라운드 스크립트 (service-worker)
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
