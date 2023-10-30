// filter 변수에 사용할 타입을 정의합니다.
interface IFilter {
  target: string | string[];
  mode: string;
  status: number[];
  handler: (
    res: string,
    method: string,
    url: string,
    xml: XMLHttpRequest,
    status: number
  ) => [number, string];
}

type IFilters = IFilter[];

// api 에서 사용할 댓글 타입을 정의합니다.
interface Writer {
  id: string;
  memberKey: string;
  nick: string;
  image: {
    url: string;
    service: string;
    type: string;
  };
  currentPopularMember: boolean;
}

interface IComment {
  id: number;
  refId: number;
  writer: Writer;
  content: string;
  updateDate: number;
  memberLevel: number;
  memberLevelIconId: number;
  isRef: boolean;
  isDeleted: boolean;
  isArticleWriter: boolean;
  isNew: boolean;
  isRemovable: boolean;
  standardReportPopup: {
    normalUrl: string;
    darkUrl: string;
    showRemoveAlert: boolean;
  };
  replyMember?: {
    id: string;
    memberKey: string;
    nick: string;
    currentPopularMember: boolean;
  };
}

type IComments = IComment[];

export { IFilters, IComment, IComments };
