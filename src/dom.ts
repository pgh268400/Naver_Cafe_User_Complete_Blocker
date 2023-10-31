import { include_string_in_array } from "./module/filter";
import { LOG } from "./module/func";

namespace DOM {
  LOG("DOM script run start");

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
      // console.log("DOMContentLoaded");
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
        const tr_user_articles = document.querySelectorAll(
          "#main-area table tr"
        );

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
}
