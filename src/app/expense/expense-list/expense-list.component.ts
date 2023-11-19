import { Component } from '@angular/core';
import { addMonths, set } from 'date-fns';
import {InfiniteScrollCustomEvent, ModalController, RefresherCustomEvent} from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import {Expense, ExpenseCriteria, Page, SortOption} from '../../shared/domain';
import { CategoryService } from '../../category/category.service';
import { ToastService } from '../../shared/service/toast.service';
import { ExpenseService } from '../expense.service';
import { debounce, finalize, interval, Subscription } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  date = set(new Date(), { date: 1 });

  currentMonth: Date = new Date();

  changeMonth(months: number): void {
    this.currentMonth = addMonths(this.currentMonth, months);
    this.loadExpenses();
  }
  expenses: Expense[] | null = null;
  readonly initialSort = 'date,desc';
  lastPageReached = false;
  loading = false;
  searchCriteria: ExpenseCriteria = { page: 0, size: 25, sort: this.initialSort};
  readonly searchForm: FormGroup;
  readonly sortOptions: SortOption[] = [
    { label: 'Created at (newest first)', value: 'createdAt,desc' },
    { label: 'Created at (oldest first)', value: 'createdAt,asc' },
    { label: 'Date (newest first)', value: 'date,desc' },
    { label: 'Date (oldest first)', value: 'date,asc' },
    { label: 'Name (A-Z)', value: 'name,asc' },
    { label: 'Name (Z-A)', value: 'name,desc' },
  ];
  categories: string[] = []; // Assuming you have an array of category names
  private readonly searchFormSubscription: Subscription;

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly categoryService: CategoryService,
    private readonly expenseService: ExpenseService,
    private readonly toastService: ToastService,
    private readonly formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({ name: [], category: [], sort: [this.initialSort] });
    this.searchFormSubscription = this.searchForm.valueChanges
      .pipe(debounce((value) => interval(value.name?.length ? 400 : 0)))
      .subscribe((value) => {
        this.searchCriteria = { ...this.searchCriteria, ...value, page: 0 };
        this.loadExpenses();
      });

    this.loadCategories();
  }

  async loadCategories() {
    this.categoryService.getCategories({ page: 0, size: 100, sort: 'name,asc' }).subscribe({
      next: (categories) => {
        this.categories = categories.content.map((category) => category.name);
      },
      error: (error) => this.toastService.displayErrorToast('Could not load categories', error),
    });
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
    this.loadExpenses();
  };

  async openModal(expense?: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense: expense ? { ...expense } : {} },
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') this.reloadExpenses();
    console.log('role', role);
  }

  private loadExpenses(next: (expensesResponse: Page<Expense>) => void = () => {}): void {
    if (!this.searchCriteria.name) delete this.searchCriteria.name;
    this.loading = true;
    // Assuming you have an 'expenseService' for fetching expenses
    this.expenseService
      .getExpenses(this.searchCriteria)
      .pipe(
        finalize(() => {
          this.loading = false;
          next({
            content: [],
            last: false,
            totalElements: 0
            }

          );
        }),
      )
      .subscribe({
        next: (expensesResponse: Page<Expense>) => {
          if (this.searchCriteria.page === 0 || !this.expenses) this.expenses = [];
          this.expenses.push(...expensesResponse.content);
          this.lastPageReached = expensesResponse.last;
        },
        error: (error) => this.toastService.displayErrorToast('Could not load expenses', error),
      });
  }


  ionViewDidEnter(): void {
    this.loadExpenses();
  }

  ionViewDidLeave(): void {
    this.searchFormSubscription.unsubscribe();
  }

  loadNextExpensePage($event: any) {
    this.searchCriteria.page++;
    this.loadExpenses(() => ($event as InfiniteScrollCustomEvent).target.complete());
  }

  reloadExpenses($event?: any): void {
    this.searchCriteria.page = 0;
    this.loadExpenses(() => ($event ? ($event as RefresherCustomEvent).target.complete() : {}));
  }
}
