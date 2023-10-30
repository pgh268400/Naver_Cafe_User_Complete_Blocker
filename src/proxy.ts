import { apply_filter_test, include_string_in_array } from "./module/filter";
import { LOG } from "./module/func";
import { IComments, IFilters } from "./types/type";

// 해당 코드는 inject.ts 에 의해 실행되는 코드이다.
// response를 변조하기 위해 사용되는 가장 핵심적인 코드이다.
namespace Proxys {
  LOG("script run start");

  /*
    특정 url 주소와 status 코드에 대해서만 응답값을 변조하도록 설정
    handler 함수에 변조할 로직을 작성해서 넘기면 상대방 쪽에서 함수를 호출해준다 (콜백 함수)
    참고로 핸들러 함수는 반드시 변조할 [Status, 응답값]을 반환해야 한다.
  */

  const filter: IFilters = [
    // 기본적으로 v2.1 api가 먼저 요청되고, 그 다음에 v2 api 가 요청됨
    {
      target: ["apis.naver.com", "articleapi", "v2.1"],
      mode: "include",
      status: [200],
      handler: (
        res: string,
        method: string,
        url: string,
        xml: XMLHttpRequest,
        status: number
      ) => {
        LOG("먼저 요청된 v2.1에서 차단된 유저의 키를 가져옵니다.");
        const res_obj = JSON.parse(res);
        LOG(res_obj);

        blocked_user_key = res_obj.result.user.blockMemberKeyList;
        LOG("blocked_user_key", blocked_user_key);
        return [status, res]; //Status, 응답값은 따로 변조하지 않고 그대로 반환한다.
      },
    },
    {
      target: ["apis.naver.com", "comments", "v2/cafes"],
      mode: "include",
      status: [200],
      handler: (
        res: string,
        method: string,
        url: string,
        xml: XMLHttpRequest,
        status: number
      ) => {
        LOG("응답값 변조 시작");
        LOG(xml);
        LOG(res);

        // 응답 데이터를 json으로 변환합니다.
        const res_obj = JSON.parse(res);

        // 응답 데이터의 result.comments 배열을 순회하면서 차단된 유저의 댓글을 필터링 합니다.
        const comments: IComments = res_obj.result.comments.items;

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

        LOG("작업 완료된 comments", updated_comments);

        // 삭제한 댓글 갯수 DOM에 반영
        const comment_dom = document.querySelector<HTMLElement>(
          "#app .article_container .ReplyBox .num"
        );
        if (comment_dom !== null) {
          comment_dom.innerText = updated_comments.length.toString();
        }

        // 데이터에 반영한다
        res_obj.result.comments.items = updated_comments;

        // json 데이터를 다시 문자열로 변환합니다.
        const res_string = JSON.stringify(res_obj);

        return [status, res_string]; //Status 는 그대로, 응답값은 변조된 값을 반환한다.
      },
    },
  ];

  // 차단된 유저의 키를 저장하는 배열 (전역 변수)
  let blocked_user_key: string[] = [];

  var _open = XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url) {
    var _onreadystatechange = this.onreadystatechange,
      _this = this;

    _this.onreadystatechange = function () {
      // 요청이 완료된 경우에만 변조하도록 함 (readyState: 4)

      // 필터링 조건에 맞는지 확인한다.
      const [index, is_apply] = apply_filter_test(
        url.toString(),
        _this.status,
        filter
      );
      if (_this.readyState === 4 && is_apply) {
        try {
          LOG("Caught! :)", method, url /*, _this.responseText*/);
          LOG("ready_status", _this.readyState, "status", _this.status);
        } catch (e) {}

        // 필터 조건에 맞는 콜백 함수를 호출하면서 상대쪽에 응답값을 넘겨준다.
        // 콜백 함수에서는 변조된 응답값을 받아오고 반영한다.
        const [modify_status, modify_res] = filter[index as number].handler(
          _this.responseText,
          method,
          url.toString(),
          _this,
          _this.status
        );

        LOG("modify_res", modify_res);
        LOG("modify_status", modify_status);

        // 여기서 responseText (응답 데이터) 와 status (응답 코드) 를 변조합니다.
        Object.defineProperty(_this, "responseText", {
          value: modify_res,
        });

        Object.defineProperty(_this, "status", {
          value: modify_status,
        });
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

// 차단된 유저의 글을 메인 화면에서 삭제하는 함수 (DOM 조작)
async function delete_block_user_article_main() {
  LOG("차단된 유저의 글을 메인 화면에서 삭제 합니다.");

  // LOG(document);

  // 메인 화면에서 글 박스를 모두 가져온다

  /*
    이유는 잘 모르겠지만 DOM 컨텐츠 로딩이 다 완료된 후 실행되어야 정상적으로 작동한다.
    위에 콘솔로 document 찍어보면 제대로 DOM 내역이 보이는데 왜 그런지 모르겠다.
    ChatGPT에 의하면 DOM이 콘솔로 보여도 실제로 로딩이 완료되지 않았을 수 있다고 한다.
    맞는 설명인진 잘 ^^;;
  */

  document.addEventListener("DOMContentLoaded", async () => {
    const board_box = document.querySelectorAll(".board-box");
    if (board_box) {
      // for of 문으로 순회하고, 그 글박스 안에 차단된 유저의 글이 있으면 삭제한다.
      for (const board of board_box) {
        // LOG("board", board);

        const table_rows = board.querySelectorAll("tr");
        if (table_rows === null) continue;

        for (const tr of table_rows) {
          // 글 박스 안에 있는 작성자 닉네임을 가져온다
          const user_nick = tr.querySelector(".p-nick a");
          if (user_nick === null) continue;
          LOG("user_nick", user_nick);

          // user_nick의 onclick 텍스트를 가져온다
          const onclick_text = user_nick.getAttribute("onclick");
          if (onclick_text === null) throw new Error("onclick_text is null");

          const split_onclick = onclick_text.split(",");
          // member_key의 원래 형태 ex => " 'mJWb3v1017TgkFAhDVI28w'"

          const member_key = split_onclick[1].trim().replace(/^'+|'+$/g, ""); //양쪽 공백 제거, 양쪽 따옴표 제거
          // LOG("member_key", member_key);
          // LOG(await get_blocked_user_key());

          const blocked_user_key = await get_blocked_user_key();

          if (include_string_in_array(blocked_user_key, member_key)) {
            // 차단된 유저의 글이면 삭제한다.
            // LOG(
            //   "Detect blocked user's article, remove it",
            //   user_nick,
            //   member_key
            // );
            tr.remove();
          }
        }
      }
    }
  });
}

// 차단된 유저의 member key를 가져오는 함수
async function get_blocked_user_key(): Promise<string[]> {
  const club_id = (window as any).g_sClubId; //현재 카페 id
  const res = await fetch(
    `https://apis.naver.com/cafe-web/cafe-cafeinfo-api/v1.1/cafes/${club_id}/block-members`,
    {
      method: "GET",
      // 아래 헤더를 추가하면 쿠키값이 자동으로 포함되어 요청되는듯?
      credentials: "include",
    }
  );

  const res_json = await res.json();
  return res_json.result;
}

// 차단된 유저의 글을 전체 글보기에서 삭제하는 함수 (DOM 조작)

function delete_block_user_article_all() {
  // 글 목록 페이지에서 실행됐으면 여기서 차단한 유저의 글이 있는지 확인하고 필터링한다.
  LOG("본문에 진입하였습니다.");

  // 현재 쿠키값 출력
  // LOG("현재 쿠키값", document.cookie);

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
      LOG(data);
      // 차단된 유저의 키를 저장한다.
      const blocked_user_key = data.result;

      LOG(
        "차단된 유저의 키를 가져왔습니다, 이 키를 기준으로 본문 글을 삭제합니다",
        blocked_user_key
      );

      // 이제 DOM을 조작하면 끝남.
      // 글 목록을 가져온다.
      const tr_user_articles = document.querySelectorAll("#main-area table tr");

      // for of문으로 순회한다
      for (const tr_user_data of tr_user_articles) {
        // LOG("tr_user_data", tr_user_data);
        const user_nick = tr_user_data.querySelector(".p-nick a");
        if (user_nick === null) continue;

        // user_nick의 onclick 텍스트를 가져온다
        const onclick_text = user_nick.getAttribute("onclick");
        if (onclick_text === null) throw new Error("onclick_text is null");

        const split_onclick = onclick_text.split(",");
        // member_key의 원래 형태 ex => " 'mJWb3v1017TgkFAhDVI28w'"
        const member_key = split_onclick[1].trim().replace(/^'+|'+$/g, ""); //양쪽 공백 제거, 양쪽 따옴표 제거
        // LOG("split_onclick", split_onclick);
        // LOG("member_key", member_key);

        if (include_string_in_array(blocked_user_key, member_key)) {
          // 차단된 유저의 글이면 삭제한다.
          LOG(
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

// 현재 주소를 가져오고 이에 맞게 처리한다.
const current_url = window.location.href;
LOG("current_url", current_url);

// 특정 주소를 확인하고 처리
if (
  current_url.includes("ArticleList") ||
  current_url.includes("ArticleSearch")
) {
  delete_block_user_article_all();
} else if (current_url.includes("MyCafeIntro")) {
  delete_block_user_article_main();
}
