/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArchivosListResponse } from '../models/ArchivosListResponse';
import type { CommandResult } from '../models/CommandResult';
import type { CreateArchivoRequest } from '../models/CreateArchivoRequest';
import type { EditArchivoRequest } from '../models/EditArchivoRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ArchivosService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ArchivosCreate(
        requestBody?: CreateArchivoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Archivos/Create',
            body: requestBody,
            mediaType: 'application/json',
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
}
