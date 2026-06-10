import React, { useRef, useState } from "react";

export type ChatbotMediaFile = {
    data: string;
    type: "image" | "video";
};

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 800;
const JPEG_QUALITY = 0.7;

const compressImageBeforeUpload = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
                    width = MAX_IMAGE_DIMENSION;
                } else {
                    width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
                    height = MAX_IMAGE_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(dataUrl);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.onerror = () => resolve(dataUrl);
    });
};

export const useChatbotAttachments = (activeTab: "standard" | "agent") => {
    const [selectedFiles, setSelectedFiles] = useState<ChatbotMediaFile[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (files: File[]) => {
        setIsCompressing(true);
        try {
            const loadedFiles = await Promise.all(files.map(file => new Promise<ChatbotMediaFile | null>((resolve) => {
                if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                    alert(`File ${file.name} vượt quá dung lượng cho phép 20MB.`);
                    resolve(null);
                    return;
                }
                if (!file.type.startsWith("image") && !file.type.startsWith("video")) {
                    alert(`File ${file.name} không phải ảnh hoặc video hợp lệ.`);
                    resolve(null);
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (event: ProgressEvent<FileReader>) => {
                    const dataUrl = String(event.target?.result || "");
                    if (file.type.startsWith("video")) {
                        resolve({ data: dataUrl, type: "video" });
                        return;
                    }

                    const compressed = await compressImageBeforeUpload(dataUrl);
                    resolve({ data: compressed, type: "image" });
                };
                reader.onerror = () => {
                    alert(`Không đọc được file ${file.name}. Vui lòng thử lại.`);
                    resolve(null);
                };
                reader.readAsDataURL(file);
            })));

            const validFiles = loadedFiles.filter(Boolean) as ChatbotMediaFile[];
            if (validFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...validFiles]);
            }
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        await processFiles(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) await processFiles(files);
    };

    const handlePasteFiles = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(e.clipboardData?.files || []);
        const mediaFiles = files.filter(file => file.type.startsWith("image") || (activeTab === "standard" && file.type.startsWith("video")));
        if (mediaFiles.length === 0) return;
        e.preventDefault();
        await processFiles(mediaFiles);
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearSelectedFiles = () => {
        setSelectedFiles([]);
    };

    return {
        selectedFiles,
        setSelectedFiles,
        isCompressing,
        isDragging,
        fileInputRef,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handlePasteFiles,
        removeSelectedFile,
        clearSelectedFiles,
    };
};
