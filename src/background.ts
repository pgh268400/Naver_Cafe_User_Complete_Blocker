namespace Background {
  // 컨텐츠 스크립트 등록을 위해 작동하는 백그라운드 스크립트 (service-worker)

  // 현재 활성 탭의 정보를 가져오기
  // chrome.tabs
  //   .query({
  //     active: true,
  //     currentWindow: true,
  //   })
  //   .then((tabs) => {
  //     console.log("현재 활성 탭 정보", tabs);
  //     const current_url = tabs[0].url;

  //     if (current_url === undefined) return;
  //     console.log("current_url", current_url);

  //     if (current_url.includes("https://cafe.naver.com")) {
  //       console.log("카페 페이지에서 실행됨, 컨텐츠 스크립트 등록 시작");
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
          // matches: ["<all_urls>"],
          // 효율성을 위해 특정 사이트에서만 작동하도록 설정
          matches: ["https://cafe.naver.com/*"],
          runAt: "document_start",
          allFrames: true,
        },
      ]);
    }
  );
}
//     });
// }
