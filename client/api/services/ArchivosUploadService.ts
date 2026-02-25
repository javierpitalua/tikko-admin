/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ArchivosUploadService {
    /**
     * @param formData
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiArchivosUpload(
        formData?: {
            File?: Blob;
            Descripcion?: string;
            UsuarioId?: number;
            Folder?: string;
        },
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/archivos/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
