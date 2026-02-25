/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArchivosListResponse } from '../models/ArchivosListResponse';
import type { CommandResult } from '../models/CommandResult';
import type { EditArchivoRequest } from '../models/EditArchivoRequest';
import type { SearchResultList } from '../models/SearchResultList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ArchivosService {
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1ArchivosLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Archivos/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ArchivosEdit(
        requestBody?: EditArchivoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Archivos/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param usuarioId
     * @param id
     * @returns ArchivosListResponse OK
     * @throws ApiError
     */
    public static getApiV1ArchivosList(
        usuarioId?: number,
        id?: number,
    ): CancelablePromise<ArchivosListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Archivos/List',
            query: {
                'UsuarioId': usuarioId,
                'Id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static getApiArchivosDownload(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/archivos/{id}/download',
            path: {
                'id': id,
            },
        });
    }
}
