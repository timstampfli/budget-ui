import {Component, OnInit} from '@angular/core';
import {IonDatetime, ModalController, RefresherCustomEvent} from '@ionic/angular';
import {filter, finalize, from, mergeMap, tap} from 'rxjs';
import {ActionSheetService} from '../../shared/service/action-sheet.service';
import {Category, CategoryCriteria, Expense} from "../../shared/domain";
import {ExpenseService} from "../expense.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ToastService} from "../../shared/service/toast.service";
import {CategoryService} from "../../category/category.service";
import {CategoryModalComponent} from "../../category/category-modal/category-modal.component";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent implements OnInit{
  readonly expenseForm: FormGroup;
  submitting = false;
  expense: Expense = {} as Expense;
  readonly initialSort = 'name,asc';
  searchCriteria: CategoryCriteria = {page: 0, size: 25, sort: this.initialSort};
  categories: Category[] = [];
  datePipe = new DatePipe('en-US');

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly expenseService: ExpenseService,
    private readonly formBuilder: FormBuilder,
    private readonly modalCtrl: ModalController,
    private readonly toastService: ToastService,
    private readonly categoryService: CategoryService,
    private modalController: ModalController,
  ) {
    this.expenseForm = this.formBuilder.group({
      id: [],
      name: ['', [Validators.required, Validators.maxLength(40)]],
      categoryId: [this.expense.categoryId],
      date: [this.datePipe.transform(Date.now(), 'yyyy-MM-ddThh:mm:ss')],
      amount: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
    this.expense.categoryId = this.expense.category.id;
  }

  async loadCategories() {
    console.log("load");
    this.categoryService.getAllCategories({name:'', sort: 'name,asc'}).subscribe({
      next: (categories) => {
        this.categories.push(...categories);
      },
      error: (error) => this.toastService.displayErrorToast('Could not load categories', error),
    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.submitting = true;
    let exp = this.expenseForm.value as Expense;
    this.expenseService
      .upsertExpense(exp)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense saved');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not save expense', error),
      });
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(
        filter((action) => action === 'delete'),
        tap(() => (this.submitting = true)),
        mergeMap(() => this.expenseService.deleteExpense(this.expense.id!)),
        finalize(() => (this.submitting = false)),
      )
      .subscribe({
        next: () => {
          this.toastService.displaySuccessToast('Expense deleted');
          this.modalCtrl.dismiss(null, 'refresh');
        },
        error: (error) => this.toastService.displayErrorToast('Could not delete expense', error),
      });
  }

  ionViewWillEnter(): void {
    this.expenseForm.patchValue(this.expense);


  }

  async reloadCategories($event?: RefresherCustomEvent): Promise<void> {
    this.searchCriteria.page = 0;
    await this.loadCategories();
    if ($event) {
      await $event.target.complete();
    }
  }

  async openCategoryModal() {
    const categoryModal = await this.modalController.create({
      component: CategoryModalComponent
    });
    await categoryModal.present();

  }

}
