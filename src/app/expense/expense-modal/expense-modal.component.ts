import { Component } from '@angular/core';
import {ModalController, RefresherCustomEvent} from '@ionic/angular';
import {filter, finalize, from, mergeMap, tap} from 'rxjs';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import {Category, CategoryCriteria, Expense} from "../../shared/domain";
import {ExpenseService} from "../expense.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ToastService} from "../../shared/service/toast.service";
import { CategoryService } from "../../category/category.service";
import {CategoryModalComponent} from "../../category/category-modal/category-modal.component";

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  readonly expenseForm: FormGroup;
  submitting = false;

  expense: Expense = {} as Expense;
  readonly initialSort = 'name,asc';
  searchCriteria: CategoryCriteria = {page: 0, size: 25, sort: this.initialSort};
  categories: string[] = []; // Assuming you have an array of category names
  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly expenseService: ExpenseService,
    private readonly formBuilder: FormBuilder,
    private readonly modalCtrl: ModalController,
    private readonly toastService: ToastService,
    private readonly categoryService: CategoryService,
  ) {
    this.expenseForm = this.formBuilder.group({
      id: [], // hidden
      name: ['', [Validators.required, Validators.maxLength(40)]],
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

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.submitting = true;
    this.expenseService
      .upsertExpense(this.expenseForm.value)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Category saved');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not save category', error),
      });
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this category?'))
      .pipe(
        filter((action) => action === 'delete'),
        tap(() => (this.submitting = true)),
        mergeMap(() => this.expenseService.deleteExpense(this.expense.id!)),
        finalize(() => (this.submitting = false)),
      )
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Category deleted');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not delete category', error),
      });  }

  async showExpenseModal(): Promise<void> {
    const ExpenseModal = await this.modalCtrl.create({ component: ExpenseModalComponent });
    ExpenseModal.present();
    const { role } = await ExpenseModal.onWillDismiss();
    console.log('role', role);
  }


  ionViewWillEnter(): void {
    this.expenseForm.patchValue(this.expense);
  }

  async openModal(category?: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategoryModalComponent,
      componentProps: { category: category ? { ...category } : {} },
    });
    modal.present();
    const {role} = await modal.onWillDismiss();
    if (role === 'refresh') this.reloadCategories();
    console.log('role', role);
  }

  reloadCategories($event?: RefresherCustomEvent): void {
    this.searchCriteria.page = 0;
    this.loadCategories();
    if ($event) {
      $event.target.complete();
    }
  }
  protected readonly Expense = Expense;
}
