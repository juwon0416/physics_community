import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { storage } from '../../data/storage';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    placeholder?: string;
}

export function ImageUpload({ value, onChange, className, placeholder = "Drag & drop image here, or click to select" }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await handleUpload(files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setIsUploading(true);
        const { url, error } = await storage.uploadFile(file);
        setIsUploading(false);

        if (error) {
            alert('Upload failed: ' + error.message);
        } else if (url) {
            onChange(url);
        }
    };

    const handleRemove = () => {
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn("relative", className)}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />

            {value ? (
                <div className="relative rounded-lg overflow-hidden group h-40 w-full">
                    <img src={value} alt="Uploaded" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="text-red-500 hover:text-red-600" onClick={(e) => { e.preventDefault(); handleRemove(); }}>
                            <X className="w-4 h-4 mr-2" /> Remove Image
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[160px]",
                        isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:bg-secondary/30",
                        isUploading ? "opacity-50 pointer-events-none" : ""
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                            <p className="text-sm">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-secondary/50 p-3 rounded-full mb-3">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-center mb-1">{placeholder}</p>
                            <p className="text-xs text-muted-foreground text-center">PNG, JPG, GIF up to 5MB</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
