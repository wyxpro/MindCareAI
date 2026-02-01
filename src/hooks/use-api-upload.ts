import { useCallback, useEffect, useMemo, useState } from 'react'
import { type FileError, type FileRejection, useDropzone } from 'react-dropzone'
import { uploadFile } from '@/db/api'

export interface FileWithPreview extends File {
    preview?: string
    errors: readonly FileError[]
}

export type UseApiUploadOptions = {
    /**
     * Allowed MIME types for each file upload (e.g `image/png`, `text/html`, etc). Wildcards are also supported (e.g `image/*`).
     */
    allowedMimeTypes?: string[]
    /**
     * Maximum upload size of each file allowed in bytes. (e.g 1000 bytes = 1 KB)
     */
    maxFileSize?: number
    /**
     * Maximum number of files allowed per upload.
     */
    maxFiles?: number
}

export type UseApiUploadReturn = ReturnType<typeof useApiUpload>

export const useApiUpload = (options: UseApiUploadOptions = {}) => {
    const {
        allowedMimeTypes = [],
        maxFileSize = Number.POSITIVE_INFINITY,
        maxFiles = 1,
    } = options

    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
    const [successes, setSuccesses] = useState<string[]>([])
    const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({})

    const isSuccess = useMemo(() => {
        if (errors.length === 0 && successes.length === 0) {
            return false
        }
        if (errors.length === 0 && successes.length === files.length) {
            return true
        }
        return false
    }, [errors.length, successes.length, files.length])

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            const validFiles = acceptedFiles
                .filter((file) => !files.find((x) => x.name === file.name))
                .map((file) => {
                    const fileWithPreview = file as FileWithPreview
                    fileWithPreview.preview = URL.createObjectURL(file)
                    fileWithPreview.errors = []
                    return fileWithPreview
                })

            const invalidFiles = fileRejections.map(({ file, errors }) => {
                const fileWithPreview = file as FileWithPreview
                fileWithPreview.preview = URL.createObjectURL(file)
                fileWithPreview.errors = errors
                return fileWithPreview
            })

            const newFiles = [...files, ...validFiles, ...invalidFiles]
            setFiles(newFiles)
        },
        [files]
    )

    const dropzoneProps = useDropzone({
        onDrop,
        noClick: true,
        accept: allowedMimeTypes.length > 0 ? allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : undefined,
        maxSize: maxFileSize,
        maxFiles: maxFiles,
        multiple: maxFiles !== 1,
    })

    const onUpload = useCallback(async () => {
        setLoading(true)

        const filesWithErrors = errors.map((x) => x.name)
        const filesToUpload =
            filesWithErrors.length > 0
                ? [
                    ...files.filter((f) => filesWithErrors.includes(f.name)),
                    ...files.filter((f) => !successes.includes(f.name)),
                ]
                : files.filter((f) => !successes.includes(f.name))

        const newUploadedUrls = { ...uploadedUrls }

        const responses = await Promise.all(
            filesToUpload.map(async (file) => {
                try {
                    const result = await uploadFile(file)
                    if (result && result.url) {
                        newUploadedUrls[file.name] = result.url
                        return { name: file.name, message: undefined }
                    } else {
                        return { name: file.name, message: 'Upload failed: No URL returned' }
                    }
                } catch (error: any) {
                    return { name: file.name, message: error.message || 'Upload failed' }
                }
            })
        )

        const responseErrors = responses.filter((x) => x.message !== undefined) as { name: string; message: string }[]
        setErrors(responseErrors)

        const responseSuccesses = responses.filter((x) => x.message === undefined)
        const newSuccesses = Array.from(
            new Set([...successes, ...responseSuccesses.map((x) => x.name)])
        )

        setSuccesses(newSuccesses)
        setUploadedUrls(newUploadedUrls)
        setLoading(false)
    }, [files, errors, successes, uploadedUrls])

    useEffect(() => {
        if (files.length === 0) {
            setErrors([])
        }

        if (files.length <= maxFiles) {
            let changed = false
            const newFiles = files.map((file) => {
                if (file.errors.some((e) => e.code === 'too-many-files')) {
                    const newFile = { ...file }
                    newFile.errors = file.errors.filter((e) => e.code !== 'too-many-files')
                    changed = true
                    return newFile
                }
                return file
            })
            if (changed) {
                setFiles(newFiles)
            }
        }
    }, [files.length, maxFiles])

    return {
        files,
        setFiles,
        successes,
        uploadedUrls,
        isSuccess,
        loading,
        errors,
        setErrors,
        onUpload,
        maxFileSize: maxFileSize,
        maxFiles: maxFiles,
        allowedMimeTypes,
        ...dropzoneProps,
    }
}
