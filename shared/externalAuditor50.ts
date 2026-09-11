export const isReadOnlyWorkspace = (role: string, action: string) => ["external_auditor_read_only", "external_reviewer_read_only"].includes(role) && ["view", "request_evidence", "submit_evidence", "request_export", "download_approved_export"].includes(action);

export const isWorkspaceActive = (status: string, startsAt: Date, expiresAt: Date, now = new Date()) => status === "active" && now >= startsAt && now < expiresAt;

export const sameEntityScope = (workspaceEntityId: number, requestedEntityId: number) => workspaceEntityId === requestedEntityId;

export const canApproveExport = (requesterId: number, approverId: number, redactionStatus: string) => requesterId !== approverId && ["completed", "not_required"].includes(redactionStatus);

export const exportExpires = (expiresAt: Date, now = new Date()) => now >= expiresAt;

export const watermarkReadyForExport = (status: string, integrityHash?: string | null) => status === "completed" && Boolean(integrityHash);

export const evidenceProgress = (status: string) => ({ requested: 10, in_progress: 35, submitted: 60, under_review: 78, approved: 100, rejected: 100, closed: 100 } as Record<string, number>)[status] ?? 0;

export const canCommentOnEvidence = (authorType: string, visibility: string) => (authorType === "external_auditor" || authorType === "internal") && (visibility === "workspace" || visibility === "internal_only");
