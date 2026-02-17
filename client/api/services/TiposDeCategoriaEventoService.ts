/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SearchResultList } from '../models/SearchResultList';
import type { TiposDeCategoriaEventoListResponse } from '../models/TiposDeCategoriaEventoListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TiposDeCategoriaEventoService {
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1TiposDeCategoriaEventoLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/TiposDeCategoriaEvento/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
    /**
     * @param dominioId
     * @param id
     * @returns TiposDeCategoriaEventoListResponse OK
     * @throws ApiError
     */
    public static getApiV1TiposDeCategoriaEventoList(
        dominioId?: number,
        id?: number,
    ): CancelablePromise<TiposDeCategoriaEventoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/TiposDeCategoriaEvento/List',
            query: {
                'DominioId': dominioId,
                'Id': id,
            },
        });
    }
}
