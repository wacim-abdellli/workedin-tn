import { useRef, useState } from 'react';
import { useTusUpload } from '@/hooks/useTusUpload';

type ContractMilestoneRow = {
    id: string;
    contract_id: string;
    [key: string]: unknown;
};

type SharedAttachment = {
    url?: string;
    name?: string;
    type?: string;
    size?: number | string;
};

export type UseDeliveryUploadReturn = {
    selectedMilestoneId: string;
    setSelectedMilestoneId: React.Dispatch<React.SetStateAction<string>>;
    savedLinks: SharedAttachment[];
    savedFileStages: Record<number, 'review' | 'final'>;
    isUploadPaused: boolean;
    setIsUploadPaused: React.Dispatch<React.SetStateAction<boolean>>;
    uploadingFileName: string | null;
    setUploadingFileName: React.Dispatch<React.SetStateAction<string | null>>;
    uploadedAssetsRef: React.MutableRefObject<ContractMilestoneRow[]>;
    uploadedAssets: ContractMilestoneRow[];
    setUploadedAssets: React.Dispatch<React.SetStateAction<ContractMilestoneRow[]>>;
    isUploadPausedRef: React.MutableRefObject<boolean>;
    handlePauseUpload: () => void;
    handleResumeUpload: () => Promise<void>;
    reviewFiles: File[];
    setReviewFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isUploading: boolean;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
    uploadProgress: { current: number; total: number; currentBytes: number; totalBytes: number };
    setUploadProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number; currentBytes: number; totalBytes: number }>>;
    uploadTusFile: (file: File, bucket: string, path: string) => Promise<void>;
    isTusUploading: boolean;
    tusProgress: number;
};

export function useDeliveryUpload(): UseDeliveryUploadReturn {
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
    const [savedLinks, setSavedLinks] = useState<SharedAttachment[]>([]);
    const [savedFileStages, setSavedFileStages] = useState<Record<number, 'review' | 'final'>>({});
    const [isUploadPaused, setIsUploadPaused] = useState(false);
    const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

    const uploadedAssetsRef = useRef<ContractMilestoneRow[]>([]);
    const [_uploadedAssets, setUploadedAssets] = useState<ContractMilestoneRow[]>([]);
    const isUploadPausedRef = useRef(false);

    const {
        uploadFile: uploadTusFile,
        isUploading: isTusUploading,
        progress: tusProgress,
    } = useTusUpload({ bucket: 'contract-files' });

    const handlePauseUpload = () => {
        isUploadPausedRef.current = true;
        setIsUploadPaused(true);
    };

    const handleResumeUpload = async () => {
        isUploadPausedRef.current = false;
        setIsUploadPaused(false);
    };

    const [reviewFiles, setReviewFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentBytes: 0, totalBytes: 0 });

    return {
        selectedMilestoneId, setSelectedMilestoneId,
        savedLinks, savedFileStages,
        isUploadPaused, setIsUploadPaused,
        uploadingFileName, setUploadingFileName,
        uploadedAssetsRef, uploadedAssets: _uploadedAssets, setUploadedAssets,
        isUploadPausedRef,
        handlePauseUpload, handleResumeUpload,
        reviewFiles, setReviewFiles,
        isUploading, setIsUploading,
        uploadProgress, setUploadProgress,
        uploadTusFile, isTusUploading, tusProgress,
    };
}
