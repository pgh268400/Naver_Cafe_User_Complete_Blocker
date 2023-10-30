const IS_DEBUG = true;

/*
    디버깅을 위해 사용하는 로그 함수
    IS_DEBUG가 true일 때만 로그를 출력합니다.
    IS_DEBUG가 false일 때는 아무것도 하지 않습니다.
*/
const LOG = IS_DEBUG ? console.log.bind(console) : function () {};
export { LOG };
