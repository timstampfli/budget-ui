import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AllCategoryCriteria,
  AllExpenseCriteria,
  Category,
  CategoryCriteria,
  Expense,
  ExpenseCriteria,
  Page
} from '../shared/domain';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly apiUrl = `${environment.backendUrl}/expenses`;
  private readonly apiV2Url = `${environment.backendUrl}/v2/expenses`;

  constructor(private readonly httpClient: HttpClient) {}

  // Read

  getExpenses = (pagingExpense: ExpenseCriteria): Observable<Page<Expense>> =>
    this.httpClient.get<Page<Expense>>(this.apiUrl, { params: new HttpParams({ fromObject: { ...pagingExpense } }) });

  getAllExpenses = (sortCriteria: AllExpenseCriteria): Observable<Expense[]> =>
    this.httpClient.get<Expense[]>(this.apiV2Url, { params: new HttpParams({ fromObject: { ...sortCriteria } }) });

  // Create & Update

  upsertExpense = (expense: Expense): Observable<void> => this.httpClient.put<void>(this.apiUrl, expense);

  // Delete

  deleteExpense = (id: string): Observable<void> => this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
}
