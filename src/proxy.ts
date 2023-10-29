import { apply_filter_test, include_string_in_array } from "./module/filter";
import { IComments, IFilters } from "./types/type";

// 해당 코드는 inject.ts 에 의해 실행되는 코드이다.
// response를 변조하기 위해 사용되는 가장 핵심적인 코드이다.
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
          if (url.toString().includes("v2.1")) {
            // 먼저 요청된 v2.1에서 차단된 유저의 키를 가져옵니다.

            console.log("먼저 요청된 v2.1에서 차단된 유저의 키를 가져옵니다.");
            const res = JSON.parse(_this.responseText);
            blocked_user_key = res.result.user.blockMemberKeyList;
            console.log("blocked_user_key", blocked_user_key);
            return;
          } else if (url.toString().includes("ArticleList.nhn")) {
            // 만약에 본문 페이지를 로딩한 경우엔 글 목록을 탐색하고 차단된 유저의 글이 있다면 필터링 합니다.
            console.log(
              "본문 페이지를 로딩한 경우엔 글 목록을 탐색하고 차단된 유저의 글이 있다면 필터링 합니다."
            );
          }

          //////////////////////////////////////
          // 이곳에 응답값 변조 로직을 작성합니다.
          //////////////////////////////////////
          console.log("응답값 변조 시작");
          console.log(_this);
          console.log(_this.responseText);

          // 응답 데이터를 json으로 변환합니다.
          const res = JSON.parse(_this.responseText);

          // 응답 데이터의 result.comments 배열을 순회하면서 차단된 유저의 댓글을 필터링 합니다.
          const comments: IComments = res.result.comments.items;

          // 삭제하지 않고 남길 코멘트들을 담을 배열
          const updated_comments: IComments = [];

          /*
            댓글을 필터링 하지 않고 남길 조건
            1. 차단된 유저가 쓴 댓글이 아니여야 함 (일반 유저의 댓글이여야 함)
            2. 차단된 유저가 쓴 댓글에 달린 답글이 아니여야 함
          */

          // for of로 순회하도록 한다
          for (const comment of comments) {
            // 현재 코멘트가 차단된 유저가 쓴 것이 아니라
            // 일반 유저의 댓글인지 확인함.
            const member_key = comment.writer.memberKey;
            if (!include_string_in_array(blocked_user_key, member_key)) {
              {
                /*
                차단된 유저가 쓰지 않은 "답글" 인 경우
                그 답글이 차단된 유저의 댓글에 달린 답글인지 확인합니다.
                만약에 차단된 유저의 댓글에 달린 답글이라면 필터링 합니다.
                참고 : 실제 삭제는 하지 않고 무시함

                comment.isRef : true면 답글, false면 댓글
                comment.replyMember : 답글의 경우에만 존재하는 속성
                */
                if (
                  comment.isRef &&
                  comment.replyMember !== undefined &&
                  include_string_in_array(
                    blocked_user_key,
                    comment.replyMember.memberKey
                  )
                ) {
                  // PASS
                } else {
                  // 일반 유저의 댓글이면서, 차단된 유저의 댓글에 달린 답글이 아닌 경우 유일하게 남길 댓글임
                  updated_comments.push(comment);
                }
              }
            }
          }

          console.log("작업 완료된 comments", updated_comments);

          // 삭제한 댓글 갯수 DOM에 반영
          const comment_dom = document.querySelector<HTMLElement>(
            "#app .article_container .ReplyBox .num"
          );
          if (comment_dom !== null) {
            comment_dom.innerText = updated_comments.length.toString();
          }

          // 데이터에 반영한다
          res.result.comments.items = updated_comments;

          // json 데이터를 다시 문자열로 변환합니다.
          const res_string = JSON.stringify(res);

          // 여기서 responseText (응답 데이터) 와 status (응답 코드) 를 변조합니다.
          Object.defineProperty(_this, "responseText", {
            value: res_string,
          });

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

// 현재 주소 가져오기
const current_url = window.location.href;
console.log("current_url", current_url);

// 특정 주소를 확인하고 처리
if (current_url.includes("ArticleList")) {
  // 글 목록 페이지에서 실행됐으면 여기서 차단한 유저의 글이 있는지 확인하고 필터링한다.
  console.log("본문에 진입하였습니다.");

  // 현재 쿠키값 출력
  // console.log("현재 쿠키값", document.cookie);

  // const cookie = document.cookie; //현재 쿠키값
  const club_id = (window as any).g_sClubId; //현재 카페 id

  // fetch 요청을 보내서 현재 접속중인 유저의
  // 차단된 유저의 키를 가져옵니다.

  fetch(
    `https://apis.naver.com/cafe-web/cafe-cafeinfo-api/v1.1/cafes/${club_id}/block-members`,
    {
      method: "GET",
      // 아래 헤더를 추가하면 쿠키값이 자동으로 포함되어 요청되는듯?
      credentials: "include",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // 차단된 유저의 키를 저장한다.
      const blocked_user_key = data.result;

      console.log(
        "차단된 유저의 키를 가져왔습니다, 이 키를 기준으로 본문 글을 삭제합니다",
        blocked_user_key
      );

      // 이제 DOM을 조작하면 끝남.
      // 글 목록을 가져온다.
      const tr_user_articles = document.querySelectorAll("#main-area table tr");

      // for of문으로 순회한다
      for (const tr_user_data of tr_user_articles) {
        // console.log("tr_user_data", tr_user_data);
        const user_nick = tr_user_data.querySelector(".p-nick a");
        if (user_nick === null) continue;

        // user_nick의 onclick 텍스트를 가져온다
        const onclick_text = user_nick.getAttribute("onclick");
        if (onclick_text === null) throw new Error("onclick_text is null");

        const split_onclick = onclick_text.split(",");
        // member_key의 원래 형태 ex => " 'mJWb3v1017TgkFAhDVI28w'"
        const member_key = split_onclick[1].trim().replace(/^'+|'+$/g, ""); //양쪽 공백 제거, 양쪽 따옴표 제거
        // console.log("split_onclick", split_onclick);
        // console.log("member_key", member_key);

        if (include_string_in_array(blocked_user_key, member_key)) {
          // 차단된 유저의 글이면 삭제한다.
          console.log(
            "Detect blocked user's article, remove it",
            user_nick,
            member_key
          );
          tr_user_data.remove();
        }
      }
    })
    .catch((error) => {
      console.error("오류 발생:", error);
    });
}
