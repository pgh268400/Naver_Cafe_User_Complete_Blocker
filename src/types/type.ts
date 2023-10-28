interface IFilter {
  target: string | string[];
  mode: string;
  status: number[];
}

type IFilters = IFilter[];

export { IFilters };
