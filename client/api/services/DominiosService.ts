/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DominiosListResponse } from '../models/DominiosListResponse';
import type { SearchResultList } from '../models/SearchResultList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DominiosService {
    /**
     * @param id
     * @returns DominiosListResponse OK
     * @throws ApiError
     */
    public static getApiV1DominiosList(
        id?: number,
    ): CancelablePromise<DominiosListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Dominios/List',
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
    public static getApiV1DominiosLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Dominios/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
}
