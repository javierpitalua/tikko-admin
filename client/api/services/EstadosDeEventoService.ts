/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EstadosDeEventoListResponse } from '../models/EstadosDeEventoListResponse';
import type { SearchResultList } from '../models/SearchResultList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EstadosDeEventoService {
    /**
     * @param id
     * @returns EstadosDeEventoListResponse OK
     * @throws ApiError
     */
    public static getApiV1EstadosDeEventoList(
        id?: number,
    ): CancelablePromise<EstadosDeEventoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/EstadosDeEvento/List',
            query: {
                'Id': id,
            },
        });
    }
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1EstadosDeEventoLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/EstadosDeEvento/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
}
