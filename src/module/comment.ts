// 댓글인지 답글인지 판단하는 함수.

import { IComment } from "../types/type";

export function is_reply(comment: IComment): boolean {
  return comment.isRef === 
}
