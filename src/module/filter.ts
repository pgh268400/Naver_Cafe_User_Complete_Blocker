import { IFilters } from "../types/type";

// 필터링 조건이 맞는지 확인하는 함수
function apply_filter_test(url: string, xml_status: number, filter: IFilters) {
  if (!(filter && filter.length > 0)) return false; // 필터가 없으면 변조 필터링이 적용되지 않아야 함
  for (const item of filter) {
    const { target, mode, status: filterStatus } = item;

    // include 모드인 경우 url이 target을 포함하는 경우에만 필터링합니다.
    if (mode === "include") {
      // target이 string인지 string[] 인지 체크한다.
      if (typeof target === "string") {
        if (url.includes(target)) {
          // 변조 필터링이 적용되어야 함
          if (filterStatus.includes(xml_status)) {
            return true;
          }
        }
      } else if (Array.isArray(target)) {
        // 배열인 경우 모든 target이 포함되어야만 필터링합니다.
        let is_all_include = true;
        for (const target_item of target) {
          if (!url.includes(target_item)) {
            is_all_include = false;
            break;
          }
        }
        if (is_all_include) {
          // 변조 필터링이 적용되어야 함
          if (filterStatus.includes(xml_status)) {
            return true;
          }
        }
      }
    } else if (mode === "same" && url === target) {
      // same 모드인 경우 url이 target과 같은 경우에만 필터링합니다.
      if (filterStatus.includes(xml_status)) {
        return true; // 변조 필터링이 적용되어야 함
      }
    }
  }
  return false; // 변조 필터링이 적용되지 않아야 함
}

// 문자열 배열에 특정 문자열이 포함되어 있는지 확인하는 함수
// 문자열 배열에 특정 문자열이 하나라도 포함되어 있으면 true를 반환합니다.
function include_string_in_array(arr: string[], target: string): boolean {
  return arr.some((item) => item.includes(target));
}

export { apply_filter_test, include_string_in_array };
