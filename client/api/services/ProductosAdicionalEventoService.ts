/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CreateProductoAdicionalEventoRequest } from '../models/CreateProductoAdicionalEventoRequest';
import type { DeleteProductoAdicionalEventoRequest } from '../models/DeleteProductoAdicionalEventoRequest';
import type { EditProductoAdicionalEventoRequest } from '../models/EditProductoAdicionalEventoRequest';
import type { ProductosAdicionalEventoListResponse } from '../models/ProductosAdicionalEventoListResponse';
import type { SelectListItem } from '../models/SelectListItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductosAdicionalEventoService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ProductosAdicionalEventoCreate(
        requestBody?: CreateProductoAdicionalEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ProductosAdicionalEvento/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ProductosAdicionalEventoEdit(
        requestBody?: EditProductoAdicionalEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ProductosAdicionalEvento/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ProductosAdicionalEventoDelete(
        requestBody?: DeleteProductoAdicionalEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ProductosAdicionalEvento/Delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns SelectListItem OK
     * @throws ApiError
     */
    public static getApiV1ProductosAdicionalEventoGetDescription(
        id?: number,
    ): CancelablePromise<SelectListItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ProductosAdicionalEvento/GetDescription',
            query: {
                'id': id,
            },
        });
    }
    /**
     * @param eventoId
     * @param id
     * @returns ProductosAdicionalEventoListResponse OK
     * @throws ApiError
     */
    public static getApiV1ProductosAdicionalEventoList(
        eventoId?: number,
        id?: number,
    ): CancelablePromise<ProductosAdicionalEventoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ProductosAdicionalEvento/List',
            query: {
                'EventoId': eventoId,
                'Id': id,
            },
        });
    }
}
