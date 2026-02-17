/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SearchResultList } from '../models/SearchResultList';
import type { UbicacionesListResponse } from '../models/UbicacionesListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UbicacionesService {
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1UbicacionesLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Ubicaciones/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
    /**
     * @param dominioId
     * @param id
     * @returns UbicacionesListResponse OK
     * @throws ApiError
     */
    public static getApiV1UbicacionesList(
        dominioId?: number,
        id?: number,
    ): CancelablePromise<UbicacionesListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Ubicaciones/List',
            query: {
                'DominioId': dominioId,
                'Id': id,
            },
        });
    }
}
