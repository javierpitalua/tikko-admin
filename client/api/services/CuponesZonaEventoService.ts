/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CreateCuponZonaEventoRequest } from '../models/CreateCuponZonaEventoRequest';
import type { CuponesZonaEventoListResponse } from '../models/CuponesZonaEventoListResponse';
import type { DeleteCuponZonaEventoRequest } from '../models/DeleteCuponZonaEventoRequest';
import type { EditCuponZonaEventoRequest } from '../models/EditCuponZonaEventoRequest';
import type { SelectListItem } from '../models/SelectListItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CuponesZonaEventoService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1CuponesZonaEventoCreate(
        requestBody?: CreateCuponZonaEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/CuponesZonaEvento/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1CuponesZonaEventoEdit(
        requestBody?: EditCuponZonaEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/CuponesZonaEvento/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1CuponesZonaEventoDelete(
        requestBody?: DeleteCuponZonaEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/CuponesZonaEvento/Delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns SelectListItem OK
     * @throws ApiError
     */
    public static getApiV1CuponesZonaEventoGetDescription(
        id?: number,
    ): CancelablePromise<SelectListItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/CuponesZonaEvento/GetDescription',
            query: {
                'id': id,
            },
        });
    }
    /**
     * @param zonaEventoId
     * @param id
     * @returns CuponesZonaEventoListResponse OK
     * @throws ApiError
     */
    public static getApiV1CuponesZonaEventoList(
        zonaEventoId?: number,
        id?: number,
    ): CancelablePromise<CuponesZonaEventoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/CuponesZonaEvento/List',
            query: {
                'ZonaEventoId': zonaEventoId,
                'Id': id,
            },
        });
    }
}
