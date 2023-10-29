import { apply_filter_test } from "./module/filter";
import { IFilters } from "./types/type";

namespace Proxys {
  console.log("script run start");

  // 특정 url 주소와 status 코드에 대해서만 응답값을 변조하도록 설정
  const filter: IFilters = [
    // 기본적으로 v2.1 api가 먼저 요청되고, 그 다음에 v2 api 가 요청됨
    {
      target: ["apis.naver.com", "articleapi", "v2.1"],
      mode: "include",
      status: [200],
    },
    {
      target: ["apis.naver.com", "comments", "v2/cafes"],
      mode: "include",
      status: [200],
    },
  ];

  // 차단된 유저의 키를 저장하는 배열
  let blocked_user_key: string[] = [];

  var _open = XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url) {
    var _onreadystatechange = this.onreadystatechange,
      _this = this;

    _this.onreadystatechange = function () {
      // 요청이 완료된 경우에만 변조하도록 함 (readyState: 4)
      if (
        _this.readyState === 4 &&
        apply_filter_test(url.toString(), _this.status, filter)
      ) {
        try {
          console.log("Caught! :)", method, url /*, _this.responseText*/);
          console.log("ready_status", _this.readyState, "status", _this.status);
        } catch (e) {}

        try {
          // 먼저 요청된 v2.1에서 차단된 유저의 키를 가져옵니다.
          if (url.toString().includes("v2.1")) {
            console.log("먼저 요청된 v2.1에서 차단된 유저의 키를 가져옵니다.");
            const res = JSON.parse(_this.responseText);
            blocked_user_key = res.result.user.blockMemberKeyList;
            console.log("blocked_user_key", blocked_user_key);
          }

          //////////////////////////////////////
          // 이곳에 응답값 변조 로직을 작성합니다.
          //////////////////////////////////////
          console.log("응답값 변조 시작");
          console.log(_this);
          console.log(_this.responseText);

          // 여기서 responseText (응답 데이터) 와 status (응답 코드) 를 변조합니다.
          // Object.defineProperty(_this, "responseText", {
          //   value: _this.responseText.replaceAll("니다", "무니다."),
          // });

          // Object.defineProperty(_this, "status", {
          //   value: 200,
          // });

          /////////////// 종료 //////////////////
        } catch (e) {}
      }
      // call original callback
      if (_onreadystatechange)
        _onreadystatechange.apply(this, arguments as any);
    };

    // detect any onreadystatechange changing
    Object.defineProperty(this, "onreadystatechange", {
      get: function () {
        return _onreadystatechange;
      },
      set: function (value) {
        _onreadystatechange = value;
      },
    });

    return _open.apply(_this, arguments as any);
  };
}
