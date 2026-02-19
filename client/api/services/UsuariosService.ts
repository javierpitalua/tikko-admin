/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CreateUsuarioRequest } from '../models/CreateUsuarioRequest';
import type { DeleteUsuarioRequest } from '../models/DeleteUsuarioRequest';
import type { EditUsuarioRequest } from '../models/EditUsuarioRequest';
import type { SearchResultList } from '../models/SearchResultList';
import type { SelectListItem } from '../models/SelectListItem';
import type { UsuariosListResponse } from '../models/UsuariosListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsuariosService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1UsuariosCreate(
        requestBody?: CreateUsuarioRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Usuarios/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1UsuariosEdit(
        requestBody?: EditUsuarioRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Usuarios/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1UsuariosDelete(
        requestBody?: DeleteUsuarioRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Usuarios/Delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns SelectListItem OK
     * @throws ApiError
     */
    public static getApiV1UsuariosGetDescription(
        id?: number,
    ): CancelablePromise<SelectListItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Usuarios/GetDescription',
            query: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns UsuariosListResponse OK
     * @throws ApiError
     */
    public static getApiV1UsuariosList(
        id?: number,
    ): CancelablePromise<UsuariosListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Usuarios/List',
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
    public static getApiV1UsuariosLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Usuarios/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
}
