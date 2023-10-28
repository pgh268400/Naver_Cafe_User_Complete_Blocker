// // Redefine 오류를 피하기 위해 반드시 스크립트들은 namespace로 감싸야 한다.
// // content script들은 변수를 서로 공유하지 않는 듯 함.

// namespace App {
//   console.log("카페 유저 차단 확장 프로그램이 실행되었습니다.");

//   // 댓글의 모든 유저 닉네임을 가져온다. (DOM)
//   const all_user_nick_names = document.querySelectorAll(
//     ".comment_list .comment_nick_box a"
//   );

//   // 중복을 제거하기 위해 집합을 사용한다.
//   const unique_user_nick = new Set();

//   // 유저 닉네임을 집합에 삽입한다.
//   for (const user_nick_name of all_user_nick_names)
//     unique_user_nick.add(user_nick_name.textContent);

//   console.log(unique_user_nick);

//   // 모든 유저의 댓글을 가져온다.
//   const all_user_comments = document.querySelectorAll(
//     ".comment_list .CommentItem"
//   );

//   // 댓글인지 답글인지 확인하는 함수
//   // true면 답글, false면 댓글
//   function is_reply(comment_item: Element): boolean {
//     return comment_item.className.includes("CommentItem--reply");
//   }

//   // 댓글을 순회하며 처리한다.
//   for (const [index, user_comment] of all_user_comments.entries()) {
//     // 차단한 멤버인지 체크한다
//     const is_block_user = user_comment.querySelector(".comment_deleted");

//     // 차단한 멤버가 "댓글"을 썼을 경우 차단한 멤버 아래로 달린 모든 답글을 삭제한다.
//     if (
//       is_block_user !== null &&
//       !user_comment.className.includes("CommentItem--reply")
//     ) {
//       console.log("차단 멤버 댓글 발견", is_block_user);

//       let copy_idx = index;
//       while (true) {
//         const next_comment = all_user_comments[copy_idx + 1];

//         // 다음 답글이 없으면 아무것도 안하고 바로 종료한다.
//         if (next_comment === undefined) break;

//         // 다음 댓글이 답글이면 계속 삭제하고 댓글이라면 삭제를 멈춘다.
//         if (next_comment.className.includes("CommentItem--reply")) {
//           console.log("답글 삭제", next_comment);
//           next_comment.remove();
//           copy_idx++;
//         } else {
//           break;
//         }
//       }

//       // 답글 삭제가 끝났으니 차단한 본인도 삭제한다.
//       user_comment.remove();
//     }
//   }
// }
