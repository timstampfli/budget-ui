// ------
// Paging
// ------

export interface SortCriteria {
  sort: string;
}

export interface PagingCriteria extends SortCriteria {
  page: number;
  size: number;
}

export interface Page<T> {
  content: T[];
  last: boolean;
  totalElements: number;
}

// ----
// Misc
// ----

export interface SortOption {
  label: string;
  value: string;
}

// --------
// Category
// --------

export interface Category {
  id?: string;
  name: string;
}

export interface CategoryCriteria extends PagingCriteria {
  name?: string;
}

export interface AllCategoryCriteria extends SortCriteria {
  name?: string;
}

export interface Expense{
  id?: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
  categoryId?: string;
  amount: number;
  date: Date;
}

export interface ExpenseCriteria extends PagingCriteria {
  name?: string;
  yearMonth?: number;
}

export interface AllExpenseCriteria extends SortCriteria {
  name?: string;
}
