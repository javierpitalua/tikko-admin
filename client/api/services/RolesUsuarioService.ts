/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RolesUsuarioListResponse } from '../models/RolesUsuarioListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RolesUsuarioService {
    /**
     * @param id
     * @returns RolesUsuarioListResponse OK
     * @throws ApiError
     */
    public static getApiV1RolesUsuarioList(
        id?: number,
    ): CancelablePromise<RolesUsuarioListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/RolesUsuario/List',
            query: {
                'Id': id,
            },
        });
    }
}
