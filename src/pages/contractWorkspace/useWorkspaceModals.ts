import { useState } from 'react';

export type UseWorkspaceModalsReturn = {
    deliverOpen: boolean;
    setDeliverOpen: React.Dispatch<React.SetStateAction<boolean>>;
    deliverNote: string;
    setDeliverNote: React.Dispatch<React.SetStateAction<string>>;
    changesOpen: boolean;
    setChangesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    disputeOpen: boolean;
    setDisputeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    fundEscrowOpen: boolean;
    setFundEscrowOpen: React.Dispatch<React.SetStateAction<boolean>>;
    confirmReleaseOpen: boolean;
    setConfirmReleaseOpen: React.Dispatch<React.SetStateAction<boolean>>;
    cancelOpen: boolean;
    setCancelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    holdClearanceOpen: boolean;
    setHoldClearanceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    holdClearanceReason: string;
    setHoldClearanceReason: React.Dispatch<React.SetStateAction<string>>;
    isHoldingClearance: boolean;
    setIsHoldingClearance: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useWorkspaceModals(): UseWorkspaceModalsReturn {
    const [deliverOpen, setDeliverOpen] = useState(false);
    const [deliverNote, setDeliverNote] = useState('');
    const [changesOpen, setChangesOpen] = useState(false);
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [fundEscrowOpen, setFundEscrowOpen] = useState(false);
    const [confirmReleaseOpen, setConfirmReleaseOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [holdClearanceOpen, setHoldClearanceOpen] = useState(false);
    const [holdClearanceReason, setHoldClearanceReason] = useState('');
    const [isHoldingClearance, setIsHoldingClearance] = useState(false);

    return {
        deliverOpen, setDeliverOpen,
        deliverNote, setDeliverNote,
        changesOpen, setChangesOpen,
        disputeOpen, setDisputeOpen,
        fundEscrowOpen, setFundEscrowOpen,
        confirmReleaseOpen, setConfirmReleaseOpen,
        cancelOpen, setCancelOpen,
        holdClearanceOpen, setHoldClearanceOpen,
        holdClearanceReason, setHoldClearanceReason,
        isHoldingClearance, setIsHoldingClearance,
    };
}
