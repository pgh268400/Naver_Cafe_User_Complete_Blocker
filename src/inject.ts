/*
  크롬에서 content script 들은 DOM 과는 동기화 되어 있어서 DOM에는 바로 접근이 가능하지만.
  변수는 동기화 되어 있지 않기 때문에 페이지의 window 변수 같은것에 접근할 수 없음.
  접근을 위해 일종의 꼼수 사용. 페이지에 script 태그로써 삽입하여 window 변수나 페이지 내의 변수를 접근할 수 있게 한다.

  해당 코드는 background.ts 에 의해 실행되는 코드이다.
*/

namespace Inject {
  var s: any = document.createElement("script");
  s.src = chrome.runtime.getURL("proxy.js");

  // 밑에 2줄 추가해줘야 Console.log 한글깨짐 발생 안함
  s.setAttribute("type", "text/javascript");
  s.charset = "UTF-8";

  s.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}
