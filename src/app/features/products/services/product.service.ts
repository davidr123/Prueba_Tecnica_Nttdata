import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ProductListResponse, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  getAll(): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(this.baseUrl);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  checkId(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/verification/${id}`);
  }

  create(product: Product): Observable<{ message: string; data: Product }> {
    return this.http.post<{ message: string; data: Product }>(this.baseUrl, product);
  }

  update(product: Product): Observable<{ message: string; data: Product }> {
    const { id, ...body } = product;
    return this.http.put<{ message: string; data: Product }>(
      `${this.baseUrl}/${id}`,
      body
    );
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
