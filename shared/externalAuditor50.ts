export const isReadOnlyWorkspace = (role: string, action: string) => ["external_auditor_read_only", "external_reviewer_read_only"].includes(role) && ["view", "request_evidence", "submit_evidence", "request_export", "download_approved_export"].includes(action);

export const isWorkspaceActive = (status: string, startsAt: Date, expiresAt: Date, now = new Date()) => status === "active" && now >= startsAt && now < expiresAt;

export const sameEntityScope = (workspaceEntityId: number, requestedEntityId: number) => workspaceEntityId === requestedEntityId;

export const canApproveExport = (requesterId: number, approverId: number, redactionStatus: string) => requesterId !== approverId && ["completed", "not_required"].includes(redactionStatus);

export const exportExpires = (expiresAt: Date, now = new Date()) => now >= expiresAt;
