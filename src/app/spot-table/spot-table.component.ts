import {Component, AfterViewInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatPaginator, MatSort, MatTableDataSource, MatFormField, MatToolbar, MatIcon, PageEvent} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import {merge} from 'rxjs/observable/merge';
import {of as observableOf} from 'rxjs/observable/of';
import {catchError} from 'rxjs/operators/catchError';
import {map} from 'rxjs/operators/map';
import {startWith} from 'rxjs/operators/startWith';
import {switchMap} from 'rxjs/operators/switchMap';

@Component({
  selector: 'app-spot-table',
  templateUrl: './spot-table.component.html',
  styleUrls: ['./spot-table.component.css']
})

export class SpotTableComponent implements AfterViewInit {
  displayedColumns = ['trx_time', 'trx_ammount', 'trx_category', 'account_nbr'];
  dataService: HttpDao | null;
  dataSource = new MatTableDataSource();

  resultsLength = 1;
  isLoadingResults = false;
  isRateLimitReached = false;

  toolbarTitle = 'Bankdata Aarhus - Playtime';
  noDataString = 'Ingen data...';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.dataService = new HttpDao(this.http);
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.dataService!.getTransactions(this.paginator.pageIndex);
        }),
        map(data => {
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = this.resultsLength + data.transactions.length;
          return data.transactions;
        }),
        catchError((e) => {
          this.isLoadingResults = false;
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe(data => this.dataSource.data = data);

  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

}

export interface BankApi {
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  account_nbr: string;
  trx_time: Date;
  trx_description: string;
  trx_category: string;
  trx_subcategory : string;
  trx_ammount: string;
}

export class HttpDao {
  constructor(private http: HttpClient) {}

  getTransactions(page: number): Observable<BankApi> {
    const href = 'http://34.243.86.224:11111/transactions';
    const requestUrl =
        `${href}?arg1=fetchByPage&arg2=7454-7548301&arg3=${page + 1}`;
        console.log('retrieving !! from url --> ' + requestUrl );
    return this.http.get<BankApi>(requestUrl);
  }
}
