/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EstadosDeReservacionListResponse } from '../models/EstadosDeReservacionListResponse';
import type { SearchResultList } from '../models/SearchResultList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EstadosDeReservacionService {
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1EstadosDeReservacionLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/EstadosDeReservacion/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
    /**
     * @param id
     * @returns EstadosDeReservacionListResponse OK
     * @throws ApiError
     */
    public static getApiV1EstadosDeReservacionList(
        id?: number,
    ): CancelablePromise<EstadosDeReservacionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/EstadosDeReservacion/List',
            query: {
                'Id': id,
            },
        });
    }
}
